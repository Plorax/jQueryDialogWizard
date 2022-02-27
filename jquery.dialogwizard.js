/**
 * @library DialogWizard
 * @description A dialog that has a wizard like flow.
 * @author Jacques Mostert <jacquesmostert@gmail.com>
 * @license GPL-3.0
 * @requires 'JQueryUI Dialog'
 */

(function (window, document, $, undefined) {
  "use strict";

  /**
   * Plugin NAMESPACE and SELECTOR
   * @type {String}
   * @api private
   */
  var NAMESPACE = "dw",
    SELECTOR = "[data-" + NAMESPACE + "]";

  /**
   * Plugin constructor
   * @param {Node} element
   * @param {Object} [options]
   * @api public
   */
  function Plugin(element, options) {
    this.options = $.extend(true, $.fn[NAMESPACE].defaults, options);
    this.$element = $(element);
    this.dlg = document.createElement("div");
    this.dialog_id = this.$element.attr("id");

    this.dlg.id = this.dialog_id;

    this.$element.append(this.dlg);
  }

  /**
   * Plugin prototype
   * @type {Object}
   * @api public
   */
  Plugin.prototype = {
    constructor: Plugin,
    version: "1.00.001",
    /**
     * Init method
     * @api public
     */
    init: function () {
      var $this = this;
      this.ops = this.options;

      this.dlg = $("#" + this.dialog_id).dialog({
        dialogClass: "no-close",
        closeOnEscape: false,
        autoShow: false,
        resizable: false,
        height: "auto",
        width: "auto",
        modal: true,
        buttons: {},
      });

      this.dlg.parent().css("opacity", 0);
    },
    show: function () {
      $("#" + this.dialog_id)
        .parent()
        .find(".ui-dialog-title")
        .html(this.ops.step_titles[this.ops.current_step]);
      $("#" + this.dialog_id).html(
        this.ops.step_contents[this.ops.current_step]
      );
      var $this = this;
      var ui_buttons = {};
      ui_buttons = this.ops.buttons
        .filter(function (item, index, arr) {
          if (item.step == $this.ops.current_step) {
            return true;
          }
          return false;
        })
        .map(function (item) {
          item.handler = item.handler.bind($this, $this.ops, $this);
          return item;
        })
        .reduce(
          (a, item, arr) => ({
            ...a,
            [item.title]: item.handler,
          }),
          ui_buttons
        );

      var form = $("#" + this.dialog_id + " form");
      var $ops = this.ops;
      var $this = this;

      if (form != null) {
        $(form).unbind("submit");
        $(form).bind("submit", function (event) {
          event.preventDefault();
          const data = new FormData(event.target);
          const value = Object.fromEntries(data.entries());

          var custom_events = $ops.custom_events
            .filter(function (item, index, arr) {
              if (
                item.step == $ops.current_step &&
                item.event_name == "form_submit"
              ) {
                return true;
              }
              return false;
            })
            .reduce(
              (a, item, arr) => ({
                ...a,
                [item.step + "_" + item.event_name]: item.callback,
              }),
              custom_events
            );

          if (
            custom_events != null &&
            Object.keys(custom_events).includes(
              $this.ops.current_step + "_form_submit"
            )
          ) {
            custom_events[$this.ops.current_step + "_form_submit"](
              value,
              $this
            );
          }

          return false;
        });
      }

      this.dlg.dialog({ buttons: ui_buttons });
      this.dlg.dialog("open");
      this.dlg.parent().animate({ opacity: 1.0 }, 250);
    },
    next: function () {
      this.ops.current_step++;
      this.show();
    },
    previous: function () {
      this.ops.current_step--;
      this.show();
    },
    close: function (time = 0) {
      if (time != 0 && time != null) {
        var $this = this;
        this.dlg.parent().animate({ opacity: 0.0 }, time, function () {
          $($this.dlg).dialog("close");
        });
      } else {
        $(this.dlg).dialog("close");
      }
    },
    final: function (options = null) {
      this.ops.step_titles[this.ops.max_steps + 1] =
        options == null ? "Complete" : options.title;
      this.ops.step_contents[this.ops.max_steps + 1] =
        options == null ? "Thank you" : options.content;
      this.ops.current_step = this.ops.max_steps + 1;

      this.show();
      var $this = this;

      this.dlg.parent().animate({ opacity: 0.0 }, 1000, function () {
        $this.close();
      });
    },
    nextStep: function (step) {
      this.ops.current_step = step;
      this.show();
    },
    reset: function () {
      this.ops.current_step = 1;
      this.show();
    },
    setup: function (options) {
      this.ops = options;
      // this.ops.step_titles = options.step_titles;
      // this.ops.step_contents = options.step_contents;
      // this.ops.buttons = options.buttons;
      // this.ops.max_steps = options.max_steps;
      // this.ops.current_step = options.current_step;
      // this.ops.custom_events = options.custom_events;
    },
    on: function (options) {
      var step = options.step;
      var event_name = options.event_time;
      var callback = options.callback;

      this.ops.custom_events[step] = { [event_name]: null };
      this.ops.custom_events[step][event_name] = callback;
    },
    submit: function () {
      var form = $("#" + this.dialog_id + " form");
      $(form).submit();
    },
    // @todo add methods
  };

  /**
   * jQuery plugin definition
   * @param  {String} [method]
   * @param  {Object} [options]
   * @return {Object}
   * @api public
   */
  $.fn[NAMESPACE] = function (method, options = null) {
    return this.each(function () {
      var $this = $(this),
        data = $this.data("fn." + NAMESPACE);
      options = typeof method === "object" ? method : options;
      if (!data) {
        $this.data("fn." + NAMESPACE, (data = new Plugin(this, options)));
      }

      // data[typeof method === "string" ? method : "init"] = data[
      //   typeof method === "string" ? method : "init"
      // ].bind(data, options, this);

      data[typeof method === "string" ? method : "init"](options);
    });
  };

  /**
   * jQuery plugin defaults
   * @type {Object}
   * @api public
   */
  $.fn[NAMESPACE].defaults = {
    max_steps: 1,
    step_titles: { 1: "Welcome" },
    step_contents: { 1: "Hello World" },
    current_step: 1,
    store_form_data: false,
    form_data: {},
    custom_events: [],
    buttons: [
      {
        step: 1,
        title: "OK",
        handler: function () {
          $(this).dw("close");
        },
      },
    ],
  };

  /**
   * jQuery plugin data api
   * @api public
   */
  $(document).on("click." + NAMESPACE, SELECTOR, function (event) {
    $(this)[NAMESPACE]();
    event.preventDefault();
  });
})(this, this.document, this.jQuery);
