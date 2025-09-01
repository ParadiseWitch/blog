---
title: Linux 命令备忘
tags:
  - Memo
  - Linux
  - Tech
createTime: 2025/08/29 23:24:03
permalink: /article/vkeyb4o5/
---
# 系统操作

## 查看当前系统发行版

```sh
cat /etc/os-release
```

# 文件操作

## 查看文件大小

```shell
ls -ll
ls -lh
```

最简单的查看方法可以使用ls -ll、ls-lh命令进行查看，当使用ls -ll，会显示成字节大小，而ls- lh会以KB、MB等为单位进行显示，这样比较直观一些。

## 查看资源占用

实时查看：`top`  
使用ps命令：

- `ps -eo pid,ppid,%mem,%cpu,cmd --sort=-%cpu | head`
- `ps -eo pid,ppid,%mem,%cpu,comm --sort=-%cpu | head`
- `ps -ef`

# 查看端口

- sudo netstat -tuln
- sudo lsof -i :8080

# 查找指定名称的文件

- find . -name "*xxx*"

# 杀死进程

kill

