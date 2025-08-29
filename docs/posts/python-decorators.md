---
title: Python 装饰器
date: 2025-08-29T00:00:00.000Z
category: Software
createTime: 2025/08/29 22:36:29
permalink: /article/dgrc5vmm/
---
# 装饰器vs注解
python的装饰器和java的注解虽然语法一样，但是有很大不同。

python的装饰器用于给函数增加功能。java的注解只是给类、方法、属性添加标签。它两很多时候都被用来校验参数、增加功能、减少代码重复、面向切面等。

通过反射获取函数上的装饰器。
```python
# 获取装饰器的方法
def get_decorator(func):
    # 如果被装饰的函数有装饰器，返回装饰器；否则返回None
    if hasattr(func, "__closure__") and func.__closure__ is not None:
        closure = func.__closure__
        for cell in closure:
            if isinstance(cell.cell_contents, type(my_decorator)):
                return cell.cell_contents
    return None
```

    
# 使用Python的装饰器实现类似Java的注解
#card [用 Python的装饰器实现类似 Java 的注解 | Hexo (rothleer.github.io)](https://rothleer.github.io/2020/09/02/%E7%94%A8%20Python%E7%9A%84%E8%A3%85%E9%A5%B0%E5%99%A8%E5%AE%9E%E7%8E%B0%E7%B1%BB%E4%BC%BC%20Java%20%E7%9A%84%E6%B3%A8%E8%A7%A3/)
```python
class target:
    TYPE_CLASS = 'type'
    TYPE_FUNCTION = 'function'
    TYPE_METHOD = 'method'

    def __init__(self, type):
        self.type = type
        self.temporary_stroage_params = None

    def __call__(self, target_annotation):
        def f(*args, **kwargs):
            if len(args) == 1 and len(kwargs) == 0:
                obj = args[0]
                if type(obj).__name__ != self.type:
                    raise Exception('Anno target is Wrong!')
                self.add_to_meta(obj, target_annotation)
                return obj
            elif len(args) == 0:
                if len(kwargs) != 0:
                    self.temporary_stroage_params = kwargs
                return f
            else:
				raise Exception('Annotation Modification Type Exception')
        return f

    def add_to_meta(self, obj, target_annotation):
        ts_params = self.temporary_stroage_params  # temporary_stroage_params
        default_params_name = target_annotation.__code__.co_varnames
        default_params_value = target_annotation.__defaults__
        params = {}
        anno = target_annotation.__name__
        size = target_annotation.__code__.co_argcount
        for i in range(size):
            param_name = default_params_name[i]
            if ts_params is not None and param_name in ts_params:
                params[param_name] = ts_params[param_name]
            else:
                params[param_name] = default_params_value[i]

        if hasattr(obj, '__meta__'):
            obj.__meta__[anno] = params
        else:
            if anno in obj.__meta__:
                raise Exception('Annotation Modification Repetition Exception')
            obj.__meta__ = {anno: params}
        self.temporary_stroage_params = None
```

```python
@target(type=target.TYPE_FUNCTION)
def anno1(foo='f', bar='b'):
    pass


@target(type=target.TYPE_FUNCTION)
def anno2():
    pass


@target(type=target.TYPE_FUNCTION)
def anno3(foo='f', bar='b'):
    pass


@anno1
@anno2()
@anno3(foo='zhiding')
def func():
    print('exec')

print(func.__meta__)
#>>> {'anno3': {'foo': 'zhiding', 'bar': 'b'}, 'anno2': {}, 'anno1': {'foo': 'f', 'bar': 'b'}}
```
	