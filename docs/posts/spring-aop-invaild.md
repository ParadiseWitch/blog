---
title: spring中调用生成AOP增强方法失效问题
createTime: 2025/09/01 23:18:41
tags:
  - aop
  - spring
permalink: /article/oqcbm0ok/
---

## 问题

spring中，service类的普通方法调用被aop增强的方法时，需要使用注入的自己的代理类。使用this调用本类，aop无法生效。

```java
@Service
public class UserTestAop {
    @Cacheable(value = "UserTestAop", key = "#id")
    public User findById(String id) {
        return null;
    }
    public User findByIdNoCache(String id) {
        return findById(id);  // 这里调用findById方法，@Cacheable注解会失效
    }
}
```

## 失效原因

aop对注解方法增强以后，增强后的方法代码生成在原来类的代理类。而spring容器中管理的bean是原来的类，直接（使用this）调用方法时，调用的是原来类的方法，即代理前的代码。

## 解决办法

将spring中原类的注入模式改为代理类注入，这样spring容器中注入的就是代理类的bean。然后在代码中注入代理类以从容器中获取代理类，使用代理类的增强方法即可。

在类上添加注解 `@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)`
自己注入本类。例如命名：添加下划线前缀
使用自己注入的本类，调用添加了Aop注解的方法。

```java
@Service
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
public class UserTestAop {
    @Autowired
    UserTestAop userTestAop;
    
    @Cacheable(value = "UserTestAop", key = "#id")
    public User findById(String id) {
        return null;
    }
 
    public User findByIdNoCache(String id) {
        return userTestAop.findById(id);
    }
}
```

## 补充

> [!question]
> 为什么必须要在bean中注入自己?> 只添加@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)不可以吗，调用自己方法的地方使用this，如下：
>
> ```java
> @Service
> @Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
> public class UserTestAop {
>   @Cacheable(value = "UserTestAop", key = "#id")
>   public User findById(String id) {
>     return null;
>   }
>   public User findByIdNoCache(String id) {
>     return this.findById(id);
>   }
> }
> ```

关键误区在于：
> 代理对象会在执行普通方法时把 `this` 关键字替换成原始的被代理对象。

- 当代理调用目标对象的方法时，会把 `this` 绑定为**目标对象的实例**（原始对象）。
- 所以方法内部的 `this` 永远是原始对象，不可能是代理对象本身。
换句话说：
- 代理类只负责拦截方法调用，它自己不会被方法内部再拿来当 `this` 用。
- 一旦进入目标对象，内部调用就已经“绕开”了代理。

**验证**:

```java
public User findByIdNoCache(String id) {
    System.out.println("this class: " + this.getClass());
    return this.findById(id);
}
```

你会看到打印的不是代理类（`com.sun.proxy...` 或 CGLIB 增强类），而是你的原始类 `UserTestAop`。
动态生成的代理类伪代码：

```java
public class UserTestAop$$EnhancerBySpringCGLIB extends UserTestAop {

    // 持有原始对象引用
    private UserTestAop target;

    // 持有 AOP 增强逻辑
    private MethodInterceptor interceptor_findById;

    public UserTestAop$$EnhancerBySpringCGLIB(UserTestAop target,
                                               MethodInterceptor interceptor_findById) {
        this.target = target;
        this.interceptor_findById = interceptor_findById;
    }

    @Override
    public User findById(String id) {
        // 调用拦截器，执行 @Cacheable 增强
        return (User) interceptor_findById.invoke(
            target, // 原始对象
            UserTestAop.class.getMethod("findById", String.class),
            new Object[]{id}
        );
    }

    @Override
    public User findByIdNoCache(String id) {
        // 注意! 这里不是使用this,而是直接调用原始对象target
        return target.findByIdNoCache(id);
    }
}
```
