/**
 * PooledClass工具类，将一个类进行拓展
 * 在销毁实例的时候将执行完destructor方法的实例存入类的instancePool中，减少下次实例化的内存开销
 */ 

var oneArgumentPooler = function(copyFiledsForm) {
  var Klass = this
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop()
    Klass.call(instance, copyFiledsForm)
    return instance
  } else {
    return new Klass(copyFiledsForm)
  }
}

var twoArgumentPooler = function(a1, a2) {
  var Klass = this
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop()
    Klass.call(instance, a1, a2)
    return instance
  } else {
    return new Klass(a1, a2)
  }
}

var threeArgumentPooler = function(a1, a2, a3) {
  var Klass = this
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop()
    Klass.call(instance, a1, a2, a3)
    return instance
  } else {
    return new Klass(a1, a2, a3)
  }
}

var fourArgumentPooler = function(a1, a2, a3, a4) {
  var Klass = this
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop()
    Klass.call(instance, a1, a2, a3, a4)
    return instance
  } else {
    return new Klass(a1, a2, a3, a4)
  }
}

var standardReleaser = function(instance) {
  var Klass = this
  instance.destructor()
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance)
  }
}

var DEFAULT_POOL_SIZE = 10
var DEFAULT_POOLER = oneArgumentPooler

var addPoolingTo = function(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor
  NewKlass.instancePool = []
  NewKlass.getPooled = pooler || DEFAULT_POOLER
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE
  }
  NewKlass.release = standardReleaser
  return NewKlass
}

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler 
}

module.exports = PooledClass
