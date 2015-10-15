// Generated by CoffeeScript 1.10.0
(function() {
  var calculate_all_offsets, calculate_all_stickes, check_if_can_bottom, check_if_can_stick, check_if_can_unbottom, check_if_can_unstick, check_if_fit, debug, event_handler, group_id, html_element, initialize_sticky, last_direction, last_scroll, offsets, placeholder, refresh_all_stickies, set_classes, state, static_interval, style, test_all_offsets, test_for_scroll_and_offsets, test_node_enter, test_node_exit, test_node_passing, test_node_scroll, test_on_scroll, trigger, update_everything, update_margins, update_metrics, update_offsets, update_sticky, win, win_height;

  offsets = {};

  group_id = 0;

  last_scroll = null;

  last_direction = 'initial';

  event_handler = null;

  static_interval = null;

  state = {
    gap: {
      offset: -1,
      nearest: null
    },
    offsetTop: 0,
    stickyNodes: [],
    contentNodes: [],
    visibleIndexes: []
  };

  win = $(window);

  win_height = win.height();

  html_element = $('html');

  debug = {
    is_enabled: false,
    element: $('<div id="scroll-kit-info">\n  <span class="gap"></span>\n  <label>Indexes: <span class="keys"></span></label>\n  <label>ScrollY: <span class="scroll"></span></label>\n  <label>ScrollTo: <select class="jump"></select></label>\n  <label>Direction: <span class="from_to"></span></label>\n</div>').hide().appendTo('body'),
    cached: {},
    style: '#scroll-kit-info {\n  border-radius: 0 0 5px 0;\n  background: rgba(0, 0, 0, .6);\n  color: #FFFFFF;\n  text-shadow: 1px 1px 1px #000000;\n  position: fixed;\n  padding: 10px;\n  left: 0;\n  top: 0;\n  z-index: 2;\n  font-size: 13px;\n}\n\n#scroll-kit-info .gap {\n  top: -1;\n  left: 0;\n  width: 100%;\n  position: fixed;\n}\n\n#scroll-kit-info .gap:before {\n  border-bottom: 1px dotted red;\n  position: absolute;\n  content: \' \';\n  width: 100%;\n  top: -1px;\n}\n\n#scroll-kit-info label {\n  line-height: 20px;\n  display: block;\n}',
    info: function(key) {
      return debug.cached[key] || (debug.cached[key] = debug.element.find("." + key));
    }
  };

  style = document.createElement('style');

  style.appendChild(document.createTextNode(debug.style));

  document.head.appendChild(style);

  debug.info('jump').on('change', function(e) {
    if (!debug.is_enabled) {
      return;
    }
    return $.scrollKit.scrollTo(e.target.selectedIndex, state.offsetTop);
  });

  trigger = function(type, params) {
    if (!event_handler) {
      return;
    }
    if (params == null) {
      params = {};
    }
    params.type = type;
    params.from = last_direction;
    params.scrollY = last_scroll;
    return event_handler(params);
  };

  set_classes = function(name) {
    if (!html_element.hasClass(name)) {
      html_element.removeClass('backward forward static').addClass(name);
      if (debug.is_enabled) {
        debug.info('from_to').text(last_direction + ' / ' + name);
      }
      trigger('direction', {
        to: name
      });
      last_direction = name;
    }
  };

  test_on_scroll = function() {
    var scroll_top;
    scroll_top = win.scrollTop();
    if (last_scroll === scroll_top) {
      return;
    }
    if (!scroll_top) {
      if (html_element.hasClass('has-scroll')) {
        html_element.removeClass('has-scroll');
      }
    } else {
      if (!html_element.hasClass('has-scroll')) {
        html_element.addClass('has-scroll');
      }
    }
    set_classes(scroll_top < last_scroll ? 'backward' : scroll_top > last_scroll ? 'forward' : 'static');
    clearTimeout(static_interval);
    static_interval = setTimeout(function() {
      return set_classes('static');
    }, 260);
    if (debug.is_enabled) {
      debug.info('scroll').text(scroll_top);
    }
    last_scroll = scroll_top;
    trigger('tick');
    return true;
  };

  update_margins = function(node) {
    node.margin = {
      top: parseInt(node.el.css('margin-top'), 10)
    };
  };

  update_offsets = function(node) {
    if (!node.el) {
      node.el = $(node);
    }
    node.offset = {
      top: node.el.offset().top,
      height: node.el.outerHeight(),
      is_passing: node.offset && node.offset.is_passing
    };
    update_margins(node);
  };

  update_metrics = function(i, node) {
    var fixed_bottom, should_update, test_bottom, test_top;
    fixed_bottom = (win_height - node.offset.top) + last_scroll;
    should_update = node.offset.top_from_bottom !== fixed_bottom || node.offset.index !== i;
    if (should_update) {
      node.offset.index = i;
      node.offset.top_from_bottom = fixed_bottom;
      node.offset.top_from_top = node.offset.top - last_scroll;
      node.offset.bottom_from_bottom = fixed_bottom - node.offset.height;
      node.offset.bottom_from_top = (node.offset.height - last_scroll) + node.offset.top;
      node.offset.top_from_gap = state.gap.offset - node.offset.top_from_top;
      node.offset.bottom_from_gap = node.offset.top_from_top - state.gap.offset + node.offset.height;
      test_bottom = node.offset.bottom_from_top >= state.gap.offset;
      test_top = node.offset.top_from_top <= state.gap.offset;
      node.offset.is_nearest = test_top && test_bottom;
      return true;
    }
  };

  test_node_passing = function(node) {
    if (!node.offset.is_passing) {
      return;
    }
    if (node.offset.is_nearest && (state.gap.nearest !== node.offset.index)) {
      state.gap.nearest = node.offset.index;
      if (debug.is_enabled) {
        debug.info('jump').val(node.offset.index);
      }
      trigger('nearest', {
        node: node
      });
    }
    return trigger('passing', {
      node: node
    });
  };

  test_node_scroll = function(node) {
    return trigger('scroll', {
      node: node
    });
  };

  test_node_enter = function(node) {
    if (node.offset.is_passing) {
      return;
    }
    if (node.offset.top_from_bottom <= 0) {
      return;
    }
    if (node.offset.bottom_from_top <= node.margin.top) {
      return;
    }
    node.offset.is_passing = true;
    state.visibleIndexes.push(node.offset.index);
    state.visibleIndexes.sort();
    if (debug.is_enabled) {
      debug.info('keys').text(state.visibleIndexes.join(', '));
    }
    return trigger('enter', {
      node: node
    });
  };

  test_node_exit = function(node) {
    if (!node.offset.is_passing) {
      return;
    }
    if (!((node.offset.top_from_bottom <= 0) || (node.offset.bottom_from_top <= node.margin.top))) {
      return;
    }
    node.offset.is_passing = false;
    state.visibleIndexes = state.visibleIndexes.filter(function(old) {
      return old !== node.offset.index;
    }).sort();
    if (debug.is_enabled) {
      debug.info('keys').text(state.visibleIndexes.join(', '));
    }
    return trigger('exit', {
      node: node
    });
  };

  test_all_offsets = function(scroll) {
    var i, j, len, node, ref;
    ref = state.contentNodes;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      node = ref[i];
      if (update_metrics(i, node)) {
        test_node_scroll(node);
        test_node_enter(node);
        test_node_exit(node);
        test_node_passing(node);
      }
    }
  };

  calculate_all_offsets = function() {
    var j, len, node, ref;
    ref = state.contentNodes;
    for (j = 0, len = ref.length; j < len; j++) {
      node = ref[j];
      update_offsets(node);
    }
  };

  placeholder = function(node) {
    var fixed;
    fixed = {
      width: node.width,
      height: node.orig_height,
      float: node.el.css('float'),
      position: node.el.css('position'),
      verticalAlign: node.el.css('vertical-align')
    };
    return $('<div/>').css(fixed).css('display', 'none').insertBefore(node.el);
  };

  update_sticky = function(node) {
    var fixed_bottom, parent_height, parent_top;
    if (!offsets[node.data.group]) {
      offsets[node.data.group] = node.data.offset || 0;
    }
    node.offset_top = offsets[node.data.group];
    node.orig_height = node.el.outerHeight();
    if (!node.isFloat) {
      offsets[node.data.group] += node.orig_height;
    }
    if (node.isFixed) {
      return true;
    }
    parent_top = node.parent.offset().top;
    parent_height = node.parent.height();
    node.offset = node.el.offset();
    node.height = node.orig_height;
    node.width = node.el.outerWidth();
    node.position = node.el.position();
    node.passing_top = node.offset.top - node.offset_top;
    node.passing_height = node.orig_height + node.offset_top;
    node.passing_bottom = parent_top + parent_height;
    if (node.data.fit) {
      if (node.isFloat) {
        fixed_bottom = node.offset.top + node.orig_height;
        node.fixed_bottom = node.passing_bottom - fixed_bottom;
        node.passing_bottom = fixed_bottom;
      }
      if (node.height >= win_height) {
        node.passing_height = win_height;
        node.height = win_height - node.offset_top;
      }
    }
    return true;
  };

  initialize_sticky = function(node) {
    var data, el, parent;
    el = $(node);
    data = $.extend({}, el.data('sticky') || {});
    data.group || (data.group = 0);
    parent = data.parent ? el.closest(data.parent) : el.parent();
    if (!data.group) {
      if (!(parent.data('scrollKit_gid') > 0)) {
        parent.data('scrollKit_gid', group_id += 1);
      }
    }
    data.group += '.' + (parent.data('scrollKit_gid') || 0);
    node.el = el;
    node.data = data;
    node.parent = parent;
    node.offset = el.offset();
    node.position = el.position();
    node.display = el.css('display');
    node.isFloat = el.css('float') !== 'none';
    node.isFixed = data.fixed || (el.css('position') === 'fixed');
    if (update_sticky(node)) {
      node.placeholder = placeholder(node);
    }
  };

  check_if_fit = function(sticky) {
    var fitted_top;
    if (sticky.data.fit) {
      fitted_top = win_height + last_scroll - sticky.offset_top;
      if (fitted_top >= sticky.passing_top) {
        if (!sticky.el.hasClass('fit')) {
          sticky.el.addClass('fit');
        }
        return sticky.el.css('height', Math.min(fitted_top - sticky.passing_top, sticky.height));
      } else {
        if (sticky.el.hasClass('fit')) {
          return sticky.el.removeClass('fit');
        }
      }
    }
  };

  check_if_can_stick = function(sticky) {
    if (!sticky.el.hasClass('stuck')) {
      if (sticky.placeholder) {
        sticky.placeholder.css('display', sticky.display);
      }
      return sticky.el.addClass('stuck').css({
        position: 'fixed',
        width: sticky.width,
        height: sticky.height,
        left: sticky.offset.left,
        top: sticky.offset_top,
        bottom: sticky.data.fit ? 0 : void 0
      });
    }
  };

  check_if_can_unstick = function(sticky) {
    if (sticky.el.hasClass('stuck')) {
      if (sticky.placeholder) {
        sticky.placeholder.css('display', 'none');
      }
      return sticky.el.removeClass('fit stuck bottom').attr('style', '');
    }
  };

  check_if_can_bottom = function(sticky) {
    if (!sticky.el.hasClass('bottom')) {
      return sticky.el.addClass('bottom').css({
        position: 'absolute',
        left: sticky.position.left,
        bottom: sticky.fixed_bottom || 0,
        top: 'auto',
        height: sticky.data.fit ? sticky.height : void 0
      });
    }
  };

  check_if_can_unbottom = function(sticky) {
    if (sticky.el.hasClass('bottom')) {
      return sticky.el.removeClass('bottom').css({
        position: 'fixed',
        left: sticky.offset.left,
        top: sticky.offset_top
      });
    }
  };

  calculate_all_stickes = function(scroll) {
    var j, len, ref, sticky;
    ref = state.stickyNodes;
    for (j = 0, len = ref.length; j < len; j++) {
      sticky = ref[j];
      if (sticky.isFixed) {
        continue;
      }
      if (last_scroll <= sticky.passing_top) {
        check_if_can_unstick(sticky);
      } else {
        check_if_can_stick(sticky);
        if ((last_scroll + sticky.passing_height) >= sticky.passing_bottom) {
          check_if_can_bottom(sticky);
        } else {
          check_if_can_unbottom(sticky);
        }
      }
      check_if_fit(sticky);
    }
  };

  refresh_all_stickies = function(destroy) {
    var j, len, ref, sticky;
    offsets = {};
    ref = state.stickyNodes;
    for (j = 0, len = ref.length; j < len; j++) {
      sticky = ref[j];
      if (!sticky.el) {
        initialize_sticky(sticky);
      } else {
        sticky.el.attr('style', '').removeClass('fit stuck bottom');
        sticky.placeholder.remove();
        if (!destroy) {
          update_sticky(sticky);
          sticky.placeholder = placeholder(sticky);
        }
      }
    }
  };

  test_for_scroll_and_offsets = function() {
    if (test_on_scroll()) {
      test_all_offsets();
      calculate_all_stickes();
    }
  };

  update_everything = function(destroy) {
    var i;
    last_scroll = null;
    win_height = win.height();
    refresh_all_stickies(destroy);
    calculate_all_offsets();
    test_for_scroll_and_offsets();
    if (debug.is_enabled) {
      debug.info('jump').html((function() {
        var j, ref, results;
        results = [];
        for (i = j = 1, ref = state.contentNodes.length; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
          results.push("<option>" + (i - 1) + "</option>");
        }
        return results;
      })()).val(state.gap.nearest);
    }
  };

  win.on('touchmove scroll', function() {
    return test_for_scroll_and_offsets();
  });

  win.on('resize', function() {
    return update_everything();
  });

  $.scrollKit = function(params, callback) {
    var content_className, sticky_className;
    if (typeof params === 'function') {
      event_handler = params;
      params = callback;
      callback = null;
    }
    if (typeof callback === 'function') {
      event_handler = callback;
    }
    if (params == null) {
      params = {};
    }
    if (params === 'destroy') {
      update_everything(true);
    } else {
      if (params !== 'update') {
        if (params.debug) {
          $.scrollKit.debug(params.debug);
        }
        state.offsetTop = params.top ? +params.top || 0 + params.top : void 0;
        state.gap.offset = params.gap ? +params.gap || 0 + params.gap : void 0;
        if (debug.is_enabled) {
          debug.info('gap').css('top', state.gap.offset);
        }
        sticky_className = params.stickyClassName || 'is-sticky';
        content_className = params.contentClassName || 'is-content';
        state.stickyNodes = document.getElementsByClassName(sticky_className);
        state.contentNodes = document.getElementsByClassName(content_className);
      }
      update_everything();
    }
  };

  $.scrollKit.version = '0.1.0';

  $.scrollKit.debug = function(enabled) {
    if (enabled == null) {
      enabled = true;
    }
    debug.is_enabled = !!enabled;
    debug.element[enabled ? 'show' : 'hide']();
  };

  $.scrollKit.update = function() {
    return update_everything();
  };

  $.scrollKit.destroy = function() {
    return update_everything(true);
  };

  $.scrollKit.scrollTo = function(index, offset_top) {
    html_element.animate({
      scrollTop: state.contentNodes[index].offset.top - (offset_top || 0)
    }, 260, 'swing');
  };

  $.scrollKit.eventHandler = function(callback) {
    var old_handler;
    old_handler = event_handler;
    if (typeof callback === 'function') {
      event_handler = callback;
    }
    return old_handler;
  };

}).call(this);
