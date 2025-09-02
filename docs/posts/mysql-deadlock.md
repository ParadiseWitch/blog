---
title: mysql死锁分析
createTime: 2025/09/01 12:23:01
tags:
  - mysql
permalink: /article/7v7kg82u/
---

## 背景

- 业务1: 有多个客户端不停在获取任务表中的任务用于消费。查询时通过`select fro update`语句，查询`status`为`NEW`的优先级最高的一条任务后，将`status`改为`REDY`
- 业务2: 有一个存储过程每天都会删除优先级为前10以后的任务。

## 问题

某天存储过程报错：

```
SQLSTATE=40001MESSAGE:Deadlock found when trying to get lock; try restarting transaction
```

## 结论

业务1获取任务时，恰好遇到业务2的存储过程执行，准备删除相同一行数据的任务从而导致死锁。

## 分析

### 名词定义

死锁数据：当两个或多个事务在死锁时抢占的行数据。
主键锁：在死锁数据对应的主键索引上添加的锁。
二级索引锁：在死锁数据对应的二级索引上添加的锁。

### 相关知识介绍

- MySQL InnoDB 的行级锁最终都是加在主键索引上。
- 如果`select for update`根据二级索引查询，会先在二级索引上加锁，然后通过二级索引找到行数据，最终再在行数据上的主键索引上加锁。
- delete语句删除行数据时，还要删除对应行的所有索引。因此如果表存在二级索引，delete执行时也会尝试获取这行数据的二级索引锁。

### 死锁事务分析

#### 事务1

- 相关业务：云检查资源机器通过任务框架，调用`get_task_by_preemptive`存储过程抢占式获取资源任务。
- 加锁语句：

```sql
SELECT info_id INTO @infoId FROM task_info
WHERE TASK_NAME = 'test_task_name'
AND STATUS = 'NEW'
ORDER BY PRIORITY LIMIT 1 FOR UPDATE
```

- 加锁过程：
  - 加锁语句根据`TASK_NAME` 、`STATUS` 两个条件查询，因此走的是`TASK_NAME_STATUS_EXEC_TIME` 的索引。查询时会在`TASK_NAME_STATUS_EXEC_TIME`二级索引上给所有匹配的多行数据加锁。

  - 数据库根据二级索引定位到行数据，然后在这些行数据的主键索引上加锁
- 锁定数据数目：多行

#### 事务2

- 相关业务：每天早上`auto_add_task`存储过程执行时，会删除优先级为前10以后的NEW状态资源任务，在添加新的资源任务。
- 加锁语句：

```sql
DELETE FROM task_info 
WHERE task_name = temp_task_name 
AND info_id = temp_info_id;
```

- 加锁过程：
  - 这个sql根据`TASK_NAME` 、`INFO_ID`这两个字段条件查询进行删除，因此走的是主键索引。会在主键索引上为符合条件的一行数据添加锁。
    - 在删除数据的同时会删除该行数据所对应的索引，这里会删除`TASK_NAME_STATUS_EXEC_TIME`二级索引。因此需要获取二级索引上的锁。
- 锁定数据数目：单行

### 详细流程分析

- 云检查资源任务程序获取资源任务时，通过`get_task_by_preemptive`存储过程进入事务1。
- 事务1通过`select for update`语句批量为`TASK_NAME=test_task_name`且`STATUS=NEW`的所有数据上添加`TASK_NAME_STATUS_EXEC_TIME` 二级索引锁。
- 此时`auto_add_task`存储过程执行为stl云检查添加资源任务。存储过程执行时会通过delete语句一条一条删除优先级为前10以后的资源任务。
- 执行delete语句时会进入事务2，为`TASK_NAME=test_task_name`且`INFO_ID=109213075`这一行数据添加主键锁。
- 事务1添加完二级索引上的锁之后，尝试获取这些数据的主键锁，而其中一行`INFO_ID=109213075`数据的主键锁被事务2获取了，因此事务1会等待事务2放锁
- 事务2获取到了主键锁之后，尝试更新二级索引上的锁。此时会发现二级索引已经被事务1占用。
- 此时两个事务相互等待对方所持有的锁，从而导致死锁：
  - 事务1持有死锁数据的二级索引锁，等待事务2的主键锁释放
  - 事务2持有死锁数据的主键锁，等待事务1的二级索引锁释放
- MySQL自动检测到死锁，于是选择回滚事务2来释放主键锁，使得事务1可以获取主键锁，以结束死锁状态。由于回滚了事务2的delete语句，因此`INFO_ID=109213075`这行数据并没有被删除。
- 由于游标中的delete语句报错死锁，异常捕获会将变量done改为`TRUE`，从而跳出循环关闭游标。因此死锁数据之后的任务数据都不会被删除。

### 死锁日志

相关的死锁日志证明如下

- 使用`SHOW ENGINE INNODB STATUS`语句，可以看到最近的死锁日志。
- 提取部分的死锁日志信息如下：

```
------------------------
LATEST DETECTED DEADLOCK
------------------------
2025-07-15 13:39:27 0x1f98
*** (1) TRANSACTION:
TRANSACTION 7013870934, ACTIVE 0 sec fetching rows
mysql tables in use 1, locked 1
LOCK WAIT 6 lock struct(s), heap size 1136, 194 row lock(s)
MySQL thread id 55089911, OS thread handle 57448, query id 610596034 192.168.7.75 user1 executing
SELECT info_id INTO @infoId FROM task_info WHERE TASK_NAME = 'test_task_name' AND STATUS = 'NEW' ORDER BY PRIORITY  LIMIT 1 FOR UPDATE

*** (1) HOLDS THE LOCK(S):
RECORD LOCKS space id 215 page no 837969 n bits 368 index TASK_NAME_STATUS_EXEC_TIME of table `task_info` trx id 7013870934 lock_mode X
Record lock, heap no 3 PHYSICAL RECORD: n_fields 4; compact format; info bits 32
 0: len 28; hex xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx; asc test_task_name;;
 1: len 3; hex 4e4557; asc NEW;;
 2: len 5; hex xxxxxxxxxx; asc     ;;
 3: len 9; hex xxxxxxxxxxxxxxxxx; asc 109205256;;
// ...省略



*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 215 page no 811369 n bits 192 index PRIMARY of table `task_info` trx id 7013870934 lock_mode X locks rec but not gap waiting
Record lock, heap no 114 PHYSICAL RECORD: n_fields 29; compact format; info bits 32
 0: len 28; hex xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx; asc test_task_name;;
 1: len 9; hex xxxxxxxxxxxxxxxxxx; asc 109213075;;


*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 215 page no 837969 n bits 368 index TASK_NAME_STATUS_EXEC_TIME of table `task_info` trx id 7013870936 lock_mode X locks rec but not gap waiting
Record lock, heap no 114 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
 0: len 28; hex 636c6f7564566965775f72756e5f73746c5765625f757365725f3130; asc test_task_name;;
 1: len 3; hex 4e4557; asc NEW;;
 2: len 5; hex 99b71cdc57; asc     W;;
 3: len 9; hex 313039323133303735; asc 109213075;;

*** WE ROLL BACK TRANSACTION (2)
------------
TRANSACTIONS
------------

```
