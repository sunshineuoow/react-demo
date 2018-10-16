var invariant = require('fbjs/lib/invariant')

/**
 * 可注入事件插件排序
 */
var eventPluginOrder = null

/**
 * 可注入的名称与事件插件模块映射
 */
var namesToPlugins = {}

/**
 * 重新使用注入的插件和插件排序计算插件列表
 *
 * @private
 */
function recomputePluginOrdering() {
  if (!eventPluginOrder) {
    // 等待直到一个eventPluginOrder被注入
    return
  }
  for (var pluginName in namesToPlugins) {
    var pluginModule = namesToPlugins[pluginName]
    var pluginIndex = eventPluginOrder.indexOf(pluginName)

    if (EventPluginRegistry.plugins[pluginIndex]) {
      continue
    }
    EventPluginRegistry.plugins[pluginIndex] = pluginModule
    var publishedEvents = pluginModule.eventTypes
    for (var eventName in publishedEvents) {
      invariant(
        publishEventForPlugin(
          publishedEvents[eventName],
          pluginModule,
          eventName,
        ),
        'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.',
        eventName,
        pluginName,
      );
    }
  }
}

/**
 * 发布一个事件，以便可以通过提供的插件调度它
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(
  dispatchConfig,
  pluginModule,
  eventName,
) {
  EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;

  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(
          phasedRegistrationName,
          pluginModule,
          eventName,
        );
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      pluginModule,
      eventName,
    );
    return true;
  }
  return false;
}

/**
 * 发布一个用于标识已调度事件的注册名称，并且可用于`EventPluginHub.putListener`来注册监听者
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(
  registrationName,
  pluginModule,
  eventName,
) {
  EventPluginRegistry.registrationNameModules[registrationName] = pluginModule;
  EventPluginRegistry.registrationNameDependencies[registrationName] =
    pluginModule.eventTypes[eventName].dependencies;
}

/**
 * 注册插件以便它们可以捕获和派发事件
 *
 * @see {EventPluginHub}
 */
var EventPluginRegistry = {
  /**
   * 注入插件的排序列表
   */
  plugins: [],

  /**
   * 注册名和派发配置的映射
   */
  eventNameDispatchConfigs: {},

  /**
   * 注册名和插件模块的映射
   */
  registrationNameModules: {},

  /**
   * 注册名和事件名的映射
   */
  registrationNameDependencies: {},

  /**
   * 小写注册名和正确的套装版本，使用警告来避免缺少的事件处理函数。仅仅在开发环境有效
   * @type {Object}
   */
  possibleRegistractionNames: null,

  /**
   * 注入一个根据插件名排列的插件顺序。允许排序与实际插件的注入解耦，因此无论进行包装，动态注入等操作，顺序总是确定的
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginOrder}
   */
  injectEventPluginOrder: function(injectedEventPluginOrder) {
    // 克隆顺序以保证不会被动态改变
    eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
    recomputePluginOrdering();
  },

  /**
   * 注入`EventPluginHub`使用的插件。这个插件名必须在`injectEventPluginOrder`注入的顺序中。
   *
   * 插件可以再页面初始化或者改变时注入
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginsByName}
   */
  injectEventPluginsByName: function(injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var pluginModule = injectedNamesToPlugins[pluginName];
      if (
        !namesToPlugins.hasOwnProperty(pluginName) ||
        namesToPlugins[pluginName] !== pluginModule
      ) {
        namesToPlugins[pluginName] = pluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  },

  /**
   * 查找提供的事件对应的插件
   *
   * @param {object} event A synthetic event.
   * @return {?object} The plugin that created the supplied event.
   * @internal
   */
  getPluginModuleForEvent: function(event) {
    var dispatchConfig = event.dispatchConfig;
    if (dispatchConfig.registrationName) {
      return (
        EventPluginRegistry.registrationNameModules[
          dispatchConfig.registrationName
        ] || null
      );
    }
    if (dispatchConfig.phasedRegistrationNames !== undefined) {
      // pulling phasedRegistrationNames out of dispatchConfig helps Flow see
      // that it is not undefined.
      var {phasedRegistrationNames} = dispatchConfig;
      for (var phase in phasedRegistrationNames) {
        if (!phasedRegistrationNames.hasOwnProperty(phase)) {
          continue;
        }
        var pluginModule =
          EventPluginRegistry.registrationNameModules[
            phasedRegistrationNames[phase]
          ];
        if (pluginModule) {
          return pluginModule;
        }
      }
    }
    return null;
  },

}

module.exports = EventPluginRegistry