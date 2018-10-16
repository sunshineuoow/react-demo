/**
 * 在第一个节点中累计不是null或者undefiend的项。这用于通过避免数组分配来节约内存，从而牺牲了API的清晰度。
 * 由于`current`在传入之前可以是null，并且执行函数后不为null，引起请确保将其分配回`current`
 *
 * `a = accumulateInto(a, b);`
 *
 * 应当谨慎使用此API。尝试`accumulate`以获得更清洁的东西。
 * This API should be sparingly used. Try `accumulate` for something cleaner.
 *
 * @return {*|array<*>} An accumulation of items.
 */

function accumulateInto(current, next) {
  if (current == null) {
    return next
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).
  if (Array.isArray(current)) {
    if (Array.isArray(next)) {
      current.push.apply(current, next)
      return current
    }
    current.push(next)
    return current
  }

  if (Array.isArray(next)) {
    // A bit too dangerous to mutate `next`.
    return [current].concat(next)
  }

  return [current, next]
}

module.exports = accumulateInto
