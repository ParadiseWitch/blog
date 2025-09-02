---
title: spring-session-data-redis 无法删除redis中session的key
createTime: 2025/08/30 23:55:01
tags:
  - spring
  - java
  - spring-session-data-redis
  - redis
permalink: /article/99xp4tly/
---

## 问题场景

起因由一个问题引起的.

## 背景

现在有一个服务使用了spring-session。服务有一个需求，需要在一个业务中将一个数据保存在用户session中的一个属性上，然后再在另一个业务将数据从redis中取出。类似以下模式：

1. 当用户操作第一次时，attr1作为key，数据1作为value会被添加到session中
2. 当用户操作第一次时，attr2作为key，数据2作为value会被添加到session中

……以此类推。

在Redis中,session相关数据如下:

```json
{
  sessionIdA: {
    attr1: value1,
    attr2: value2,
    // ..
  },
  sessionIdB: {
    attr1: value1,
    attr2: value2,
    // ...
  }
}
```

但是现在出现了一个问题：短时间内有一个用户A操作次数过多，不断地在其对应的sessionMap中添加键值对

```json
{
  sessionIdA: {
    attr1: value1,
    attr2: value2,
    // ...
    attrN: valueN
  },
}
```

最后等到要根据用户的sessionId查询session对象时, 请求redis超时。

## 解决方案

这个问题其实算是设计问题，只要将原来将存在redis中的数据形式改为如下形式就可以：

```json
{
  sessionIdA+attr1: value1,
  sessionIdA+attr2: value2,
  sessionIdA+attr3: value3,
  // ...
  sessionIdA+attrN: valueN,
}
```

这样不会导致redis中单个keyset过大,查询导致请求超时

到此为止,已经是有了完善的解决方案.

## 删除reids中的session属性

虽然上面的方法可以直接解决根本问题，但是我还是从另一个角度思考了问题.

实际上在这个业务中,每个attr存储后之后只会使用一次, 那么是不是在使用完成后在sessionMap中删除这个属性就好了?

```java
// 唯一一次的获取session中这个属性的值
request.getSession().removeAttribute()
```

想法是好的，但是事与愿违。经过测试后发现，==removeAttribute方法确实把内存中的session中的属性删除了，但是更新到redis时，发现只是在sessionMap只把对应属性的value设置成了null：==

```java
public void removeAttribute(String attributeName){
  // 内存中删除属性
  this.cached.removeAttribute(attributeName);
  // redis中将属性的值改为null
  this.putAndFlush(getSessionAttrNameKey(attributeName, null))
}

```

于是去spring-session的github找到了这么一个issue：[spring-projects/spring-session/issues/1331](https://github.com/spring-projects/spring-session/issues/1331)。

那行吧，那我就在removeAttribute方法后直接操作reids删除这个属性, 但是依旧失败. 代码:

```java
// 删除内存中的属性, 更新redis中的属性为null
request.getSession().removeAttribute()
// redis删除对应属性的键值对
redisCacheHashService.sessionHmDelete(request.getSession().getId(), attrName)
```

`sessionHmDelete`是一个封装了一个使用`redisTemplate`直接删除`redis`中`sessionMap`中key的函数：

```java
public void sessionHmDelete(string sessionId,String attrName){
 String redisKey = "spring:session:sessions:"+ sessionId;
 String mapKey = "sessionAttr:" + attrName;
 // get redisTemplate 
 RedisTemplate redisTemplate = redisTemplateService.getRedisTemplate(0);
 redisTemplate.setHashKeySerializer(new StringRedisSerializer());
 redisTemplate.sethashValueserializer(new JdkSerializationRedisSerializer());
 redisTemplate.afterPropertiesSet();
 redisTemplate.opsForHash().delete( redisKey, mapKey);
}
```

经过测试后发现通过这段代码后，redis依旧没有删除key，只是把value置为了null。
原因很简单, ==removeAttribute方法在更新reids中对应的属性为null时,不是立马更新==.

1. `removeAttribute`方法[源码](https://github.com/spring-projects/spring-session/blob/e87be43acb77de4d076cbcffbddff0d281c9edda/spring-session-data-redis/src/main/java/org/springframework/session/data/redis/RedisIndexedSessionRepository.java#L876-L880)，可以看到这里putAndFlush第二个参数传入的为 null

```java
public void removeAttribute(String attributeName) {
  this.cached.removeAttribute(attributeName);
  this.delta.put(getSessionAttrNameKey(attributeName), null);
  flushImmediateIfNecessary();
}
```

`delta`是一个 map，临时记录改变的数据，方便等到更新时将所有变动一次性更新到 redis 中。调用`removeAttribute`后，这个 map 就保存了一个键值对（key，null）

2. `flushImmediateIfNecessary`方法源码，更新时并不是马上一调用`removeAttribute`就会马上更新，默认时`RedisFlushMode`配置为`ON_SAVE`。

```java
private void flushImmediateIfNecessary() {
   if (RedisIndexedSessionRepository.this.flushMode == FlushMode.IMMEDIATE) {
    save();
   }
}
private void save() {
  saveChangeSessionId();
  saveDelta();
}
```

3. 由于不是立马更新到 `redis`，这个`save`方法会在我们手动使用 `redisTemplate` 删除 `redis` 中 `session` 中的属性后执行，于是此时又会将 `delta` 变动信息 `put` 到 `redis` 中，最终会将空值 `put` 到这个属性上。
    修改配置方法：

    ```java
    <bean class="org.springframework.session.data.redis.config.annotation.web.http.RedisHttpSessionConfiguration">
      <property name="redisFlushMode" value="IMMEDIATE"/>
    </bean>
    ```

## 总结

- spring-session-data-redis 的 `removeAttribute` 方法会删除内存中session的属性,但是redis中只是把session对应的属性置null
- spring-session-data-redis 中在redis中删除session的属性本质上是更新.更新操作不一定不会立马进行,需要查看FlushMode配置的值.
