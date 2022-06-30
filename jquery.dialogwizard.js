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
    SELECTOR = "[data-" + NAMESPACE + "='remote-modal']";

  /**
   * Plugin constructor
   * @param {Node} element
   * @param {Object} [options]
   * @api public
   */
  function Plugin(element, options) {
    this.options = $.extend({}, $.fn[NAMESPACE].defaults, options);
    this.$element = $(element);
    this.dialog_id = this.options.dialog_id;

    if (this.dialog_id == null || this.dialog_id == "") {
      this.dialog_id = $(element).attr("id");
      this.options.dialog_id = this.dialog_id;
    }

    // console.log("Constructor " + this.dialog_id);
  }

  /**
   * Plugin prototype
   * @type {Object}
   * @api public
   */
  Plugin.prototype = {
    constructor: Plugin,
    version: "1.00.236",
    /**
     * Init method
     * @api public
     */
    init: function (options = {}) {
      var $this = this;
      this.ops = options;
      this.dlg = null;

      if (!options.dialogX) {
        // console.log(this.ops);
        this.ops = $.extend({}, $.fn[NAMESPACE].defaults, this.ops);
        // console.log(this.ops);
      }

      // console.log("init " + this.dialog_id);
    },
    step: function () {
      return this.ops.current_step;
    },
    steps: function () {
      return this.ops.max_steps;
    },
    show: function (internal = false) {
      var $this = this;
      // console.log(this.ops);
      // console.log("show " + this.dialog_id);

      if (this.dlg == null) {
        this.dlg = $("#" + this.dialog_id).dialog({
          dialogClass: this.ops.dialog_class,
          closeOnEscape: false,
          autoShow: false,
          autoOpen: false,
          resizable: false,
          height: this.ops.height || "auto",
          width: this.ops.width || "auto",
          modal: true,
          buttons: {},
          minWidth: 20,
          minHeight: 20,
          position: this.ops.position || {
            my: "center top",
            at: "center top",
            of: window,
            within: window,
          },
        });
      } else {
        $("div[id='" + this.dialog_id + "']").show();
        $("div[aria-describedby='" + this.dialog_id + "']").show();
      }

      if (!internal) {
        $("div[aria-describedby='" + this.dialog_id + "']").css("opacity", "0");
      } else {
        $("div[id='" + this.dialog_id + "']").css("opacity", "0");
      }

      this.ops.on_show = this.ops.on_show.bind($this, $this.ops, $this);
      this.ops.on_close = this.ops.on_close.bind($this, $this.ops, $this);

      // apply user CSS styles
      this.ops.apply_styles = this.ops.apply_styles.bind(
        $this,
        $this.ops,
        $this
      );

      this.ops.apply_button_types = this.ops.apply_button_types.bind(
        $this,
        $this.ops,
        $this
      );

      if (this.ops.parent != null) {
        $("#" + this.dialog_id)
          .dialog()
          .appendTo(this.ops.parent);
      }

      if (this.ops.step_titles != null) {
        $("#" + this.dialog_id)
          .parent()
          .find(".ui-dialog-title")
          .html(this.ops.step_titles[this.ops.current_step]);
      }

      if (this.ops.step_titles == null) {
        $("#" + this.dialog_id)
          .parent()
          .find(".ui-dialog-title")
          .hide();
      } else {
        $("#" + this.dialog_id)
          .parent()
          .find(".ui-dialog-title")
          .show();
      }

      var $this = this;
      let typeof_val = typeof this.ops.step_contents[this.ops.current_step];

      if (typeof_val == "function") {
        $("#" + $this.dialog_id).html("<p>Loading...</p>");
        let func = $this.ops.step_contents[this.ops.current_step];
        func = func.bind($this, $this.ops, $this);
        $this.ops.step_contents[this.ops.current_step] = func;
        func();
      } else {
        let dlg_content = this.ops.step_contents[this.ops.current_step];
        dlg_content = dlg_content.replace(/{{dialog_id}}/g, $this.dialog_id);

        $("#" + this.dialog_id).html(
          this.ops.wrap_contents_with_form
            ? "<form>" + dlg_content + "</form>"
            : dlg_content
        );
      }
      let ui_buttons = {};

      $("#" + this.dialog_id)
        .find("div#button_pane button")
        .each(function () {
          let $button_this = this;
          let button_type = $(this).prop("type");
          let related_form = $(this).data("form");
          let button_text = $(this).html();
          let button_step =
            $(this).data("dialogx-step") != undefined
              ? $(this).data("dialogx-step")
              : 1;

          let button_onclick = eval($($button_this).data("onclick"));
          let button_handler = button_onclick.bind(
            this,
            $this.ops,
            $this,
            window.event
          );

          $this.ops.buttons.push({
            step: button_step,
            title: button_text,
            handler: button_handler,
            type: button_type,
            form: related_form,
          });
        });

      $("#" + this.dialog_id)
        .find("div#script_pane script")
        .each(function () {
          let $script_this = this;
          let script_text = $(this).html();
          script_text = script_text.replace(/{{dialog_id}}/g, $this.dialog_id);
          let script_step =
            $(this).data("dialogx-step") != undefined
              ? $(this).data("dialogx-step")
              : 1;

          let script_oninit = eval(script_text);
          let script_handler = script_oninit.bind(this, $this.ops, $this);

          script_handler();
        });

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

      $("#" + this.dialog_id)
        .find("div#button_pane")
        .hide();

      $("#" + this.dialog_id)
        .find("div#script_pane")
        .hide();

      let form = $("#" + this.dialog_id + " form");
      let $ops = this.ops;
      var $this = this;

      if (form != null) {
        if ($ops.custom_events.length > 0) {
          console.log("on form submit entering custom_events");

          $(form).unbind("submit");
          $(form).bind("submit", function (event) {
            event.preventDefault();
            const data = new FormData(event.target);
            const value = Object.fromEntries(data.entries());

            let custom_events = $ops.custom_events
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
        } else {
          $this.applyFormHooks();
        }
      }

      if (
        this.ops.step_load != undefined &&
        this.ops.step_load != null &&
        this.ops.step_load.length > 0
      ) {
        let step_load_events = this.ops.step_load
          .filter(function (item, index, arr) {
            if (item.step == $this.ops.current_step) {
              return true;
            }
            return false;
          })
          .map(function (item) {
            item.handler = item.handler.bind($this, $this.ops, $this);
            return item;
          });

        step_load_events.forEach(function (item, index) {
          item.handler();
        });
      }
      this.dlg.dialog({ buttons: ui_buttons });
      this.ops.apply_styles();
      this.ops.apply_button_types();
      this.dlg.dialog("open");
      this.ops.on_show();

      if (!internal) {
        $("div[aria-describedby='" + this.dialog_id + "']").animate(
          { opacity: 1.0 },
          250
        );
      } else {
        $("div[id='" + this.dialog_id + "']").animate({ opacity: 1.0 }, 250);
      }
    },
    applyFormHooks: function () {
      console.log("applying form hooks");

      let $this = this;
      let form = $("#" + this.dialog_id + " form");

      // Handle onsubmit automatically
      $(form).unbind("submit");

      $this.ops.on_form_submit = function (ops, dlg, event) {
        console.log("on_submit called " + dlg.dialog_id);

        $("#" + dlg.dialog_id + " button[type='submit']").prop(
          "disabled",
          true
        );

        if (!dlg.validateForm()) {
          event.preventDefault();
          $("#" + dlg.dialog_id + " button[type='submit']").prop(
            "disabled",
            false
          );
          return false;
        }

        let on_after_ajax_post = $("#" + dlg.dialog_id + " form").data(
          "on-ajax-after-submit"
        );
        let onAfterAjaxPost =
          on_after_ajax_post != undefined ? eval(on_after_ajax_post) : null;

        let isAjaxPost =
          $("#" + dlg.dialog_id + " form").data("method") === "ajax-post";
        let ajaxFormAction = $("#" + dlg.dialog_id + " form").prop("action");

        console.log("isAjaxPost = " + isAjaxPost);

        if (isAjaxPost) {
          event.preventDefault();
          let formData = $this.formData();
          $.ajax({
            url: ajaxFormAction,
            data: formData,
            type: "POST",
            dataType: "json",
            success: function (data) {
              if (data.success == true) {
                if (onAfterAjaxPost != undefined && onAfterAjaxPost != null) {
                  onAfterAjaxPost($this.ops, $this);
                }
                $this.close();
              } else {
                alert(
                  "An unknown error has occurred. Please try again or log a support ticket."
                );
              }
            },
          });
        }

        return false;
      };

      $(form).bind("submit", function (event) {
        console.log("internal: form.submit() called");
        return $this.ops.on_form_submit($this.ops, $this, event);
      });
    },
    next: function () {
      var $this = this;
      this.ops.current_step++;
      $("div[aria-describedby='" + this.dialog_id + "']").animate(
        { opacity: 0 },
        250,
        function () {
          $this.show();
        }
      );
    },
    previous: function () {
      var $this = this;
      this.ops.current_step--;
      $("div[aria-describedby='" + this.dialog_id + "']").animate(
        { opacity: 0 },
        250,
        function () {
          $this.show();
        }
      );
    },
    close: function (time = 250, callback = function () {}) {
      var $this = this;

      if (time != 0 && time != null) {
        $("div[aria-describedby='" + this.dialog_id + "']").animate(
          { opacity: 0.0 },
          time,
          function () {
            $($this.dlg).dialog("close");
            $this.dlg = null;
            if (
              $this.ops.dialog_id != undefined &&
              $this.ops.dialog_id != null
            ) {
              if ($this.ops.dialogX) {
                // console.log("Permanently Removing Dialog");
                $("#" + $this.ops.dialog_id).remove();
                $(
                  "div[aria-describedby='" + $this.ops.dialog_id + "']"
                ).remove();
                $this.dlg = null;
              } else {
                // console.log("Hiding Dialog");
                $("#" + $this.ops.dialog_id).hide();
                $("div[aria-describedby='" + $this.ops.dialog_id + "']").hide();
              }
            }

            callback = callback.bind($this, $this.ops, $this);
            callback();
          }
        );
      } else {
        $(this.dlg).dialog("close");
        this.dlg = null;
        if (this.ops.dialog_id != undefined && this.ops.dialog_id != null) {
          if (this.ops.dialogX) {
            // console.log("Permanently Removing Dialog");
            $("#" + this.ops.dialog_id).remove();
            $("div[aria-describedby='" + this.ops.dialog_id + "']").remove();
            this.dlg = null;
          } else {
            // console.log("Hiding Dialog");
            $("#" + this.ops.dialog_id).hide();
            $("div[aria-describedby='" + this.ops.dialog_id + "']").hide();
          }
        }
      }

      this.ops.on_close();
    },
    final: function (time = 510) {
      var $this = this;
      $("div[aria-describedby='" + this.dialog_id + "']").animate(
        { opacity: 0.0 },
        time,
        function () {
          $this.close(0);
        }
      );
    },
    nextStep: function (step) {
      var $this = this;
      this.ops.current_step = step;
      this.show();
    },
    reset: function () {
      var $this = this;
      $this.ops.current_step = 1;
      $this.show();
    },
    setElementText: function (element_identifier, text) {
      $("#" + this.dialog_id)
        .find(element_identifier)
        .text(text);
    },
    setElementValue: function (element_identifier, value) {
      $("#" + this.dialog_id)
        .find(element_identifier)
        .val(value);
    },
    setElementHTML: function (element_identifier, html) {
      $("#" + this.dialog_id)
        .find(element_identifier)
        .html($("<textarea/>").html(html).text());
    },
    setStepContent: function (step, content) {
      this.setMessageText(step, content);
    },
    setMessageText: function (index, message) {
      var $this = this;
      this.ops.step_contents[index] = message;

      $("#" + this.dialog_id).html(this.ops.step_contents[index]);
    },
    setup: function (options) {
      this.ops = options;
    },
    on: function (options) {
      var $this = this;

      let step = options.step;
      let event_name = options.event_time;
      let callback = options.callback;

      this.ops.custom_events[step] = { [event_name]: null };
      this.ops.custom_events[step][event_name] = callback;
    },
    applySyles: function () {
      if (typeof this.ops.apply_styles === "function") {
        this.ops.apply_styles();
      }
    },
    submit: function () {
      let form = $("#" + this.dialog_id + " form");
      $(form).submit();
    },
    populateFields: function (field_values_data = {}, field_mappings = {}) {
      const replaceQualifier = (m, qualifier, value) =>
        m.replace(
          new RegExp(qualifier.replace(/\[/g, "\\["), "gi"),
          value ? `${value}` : ""
        );

      let html = $("#" + this.dialog_id).html();
      for (let field in field_values_data) {
        let lookup_field =
          field_mappings[field] == undefined ? field : field_mappings[field];

        html = replaceQualifier(
          html,
          `{{${lookup_field}}}`,
          field_values_data[field]
        );
      }
      $("#" + this.dialog_id).html(html);
      // console.log(html);

      let form_field_values = {};

      for (let field in field_values_data) {
        console.log(
          "populateFields " + field + " = " + field_values_data[field]
        );

        if (field in field_mappings) {
          form_field_values[field_mappings[field]] = field_values_data[field];
          console.log("field_mappings[field] = " + field_mappings[field]);
        }
      }

      console.log(JSON.stringify(form_field_values));

      for (let field in form_field_values) {
        // text fields
        $("#" + this.dialog_id)
          .find('input[name="' + field + '"][type="text"]')
          .val(form_field_values[field])
          .trigger("change");

        // hidden fields
        $("#" + this.dialog_id)
          .find('input[name="' + field + '"][type="hidden"]')
          .val(form_field_values[field])
          .trigger("change");

        // select dropdowns
        $("#" + this.dialog_id)
          .find('select[name="' + field + '"]')
          .val(form_field_values[field])
          .trigger("change");

        // textarea
        $("#" + this.dialog_id)
          .find('textarea[name="' + field + '"]')
          .val(form_field_values[field])
          .trigger("change");
      }
    },
    validateForm: function () {
      var errors = [],
        fields = [];

      $("#" + this.dialog_id)
        .find(
          "input[class*='required'],select[class*='required'],textarea[class*='required'],div[data-type='custom-form-input-element'][data-class='required']"
        )
        .not(":button, :reset, :disabled")
        .each(function () {
          let element_name = $(this).prop("name");
          let contains_empty_span =
            $(this).find("span[name='empty']").length > 0;
          let is_visible = $(this).css("display") === "";
          if (is_visible && (contains_empty_span || $(this).val() === "")) {
            if (element_name != "" && element_name != undefined) {
              errors.push($(this).prop("name"));
              fields.push($(this).prop("title"));
            }
          }
        });

      if (errors.length > 0) {
        console.log(errors);

        $("#" + this.dialog_id + " [name='" + errors[0] + "']").focus();
        // $("#" + this.dialog_id + " #alert-info-warning").html(
        //   '<div class="alert alert-danger alert-dismissible fade in" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4>The following fields are required.</h4><strong>&nbsp;&nbsp;&nbsp;' +
        //     fields.join("<br/>&nbsp;&nbsp;&nbsp;") +
        //     "</strong></div>"
        // );
        $("#" + this.dialog_id + " button[type=submit]").removeProp("disabled");
        return false;
      }

      return true;
    },
    formData: function () {
      let form_data = {};

      $("#" + this.dialog_id)
        .find("input")
        .not(":button, :reset, :checkbox")
        .each(function () {
          if (!$(this).is(":disabled")) {
            let form_name_value = $(this).prop("name");
            let form_input_value = $(this).val();
            form_data[form_name_value] = form_input_value;
          }
        });

      $("#" + this.dialog_id)
        .find("select")
        .not(":text, :reset, :button")
        .each(function () {
          if (!$(this).is(":disabled")) {
            let form_name_value = $(this).prop("name");
            let form_input_value = $(this).find(":selected").val();
            form_data[form_name_value] = escape(form_input_value);
          }
        });

      $("#" + this.dialog_id)
        .find("textarea")
        .each(function () {
          if (!$(this).is(":disabled")) {
            let form_name_value = $(this).prop("name");
            let form_input_value = $(this).val();
            form_data[form_name_value] = escape(form_input_value);
          }
        });

      $("#" + this.dialog_id)
        .find("input[type='checkbox']")
        .each(function () {
          if (!$(this).is(":disabled")) {
            let form_name_value = $(this).prop("name");
            let form_input_value = $(this).val();
            let checked_state = $(this).is(":checked");
            form_data[form_name_value] =
              checked_state == "checked" ||
              checked_state == "true" ||
              checked_state == true
                ? form_input_value
                : "";
          }
        });

      return form_data;
    },
    applyHooks: function () {
      console.log(this.dialog_id + " applying dialog global hooks");
      applyGlobalHook();
    },
    // @todo add methods
  };

  function parseBase64Style(b64) {
    let b64_styles = b64 == undefined ? "e30=" : b64 == "" ? "e30=" : b64;
    b64_styles = atob(b64_styles);
    b64_styles = JSON.parse(b64_styles);
    return b64_styles;
  }

  function parseParametersIntoObject(string_parameters = "") {
    let parameters = string_parameters.split(";");
    let parameter_object = {};

    for (let parameter in parameters) {
      let parameter_values = parameters[parameter].split(":");
      let name = parameter_values[0];
      let value = parameter_values[1];

      if (name == "" || name == null || name == undefined) {
        continue;
      }
      parameter_object[name] = value;
    }

    return parameter_object;
  }

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

      options = $.extend({}, $.fn[NAMESPACE].defaults, options);

      if (!data) {
        $this.data("fn." + NAMESPACE, (data = new Plugin($this, options)));
      }

      // data[typeof method === "string" ? method : "init"] = data[
      //   typeof method === "string" ? method : "init"
      // ].bind(data, options, this);

      data[typeof method === "string" ? method : "init"](options);
    });
  };

  function applyGlobalHook() {
    $("a[data-dw='toggle']").each(function () {
      let hreftarget = this;
      let alreadySetup = $(hreftarget).data("dialogx-href-setup") != undefined;
      if (!alreadySetup) {
        $(hreftarget).data("dialogx-href-setup", "true");

        $(hreftarget).on("click", function (event) {
          event.preventDefault();

          let target_id = $(this).data("target");
          let html = $("div[id='" + target_id + "'][data-dw='dialogX']").html();

          let get_field_values_url = $(this).data("fetch-field-values-url");
          let field_values_data = {};
          let dialogx_styles = parseBase64Style($(this).data("dialogx-styles"));
          let override_options = parseParametersIntoObject(
            $("div[id='" + target_id + "'][data-dw='dialogX']").data(
              "dialogx-options"
            )
          );
          let field_mappings = parseParametersIntoObject(
            $("div[id='" + target_id + "'][data-dw='dialogX']").data(
              "dialogx-field-mappings"
            )
          );

          if (get_field_values_url != undefined && get_field_values_url != "") {
            let $this = this;
            $.ajax({
              url: get_field_values_url,
              dataType: "json",
              type: "GET",
              success: function (response) {
                field_values_data = response.data;

                console.log(override_options);
                let default_dialog_options = {
                  dialog_styles: $.extend(
                    {},
                    {
                      ".ui-widget-header": {
                        "background-color": "#0000C9",
                        color: "#fff",
                      },
                      ".ui-dialog-buttonset button": "btn btn-primary",
                    },
                    dialogx_styles
                  ),
                  current_step: 1,
                  position: {
                    at: "center",
                    my: "center",
                    of: window,
                    within: window,
                  },
                  step_load: [
                    {
                      step: 1,
                      handler: function () {
                        this.populateFields(field_values_data, field_mappings);
                        this.applyHooks();
                      },
                    },
                  ],
                  step_titles: {
                    1: "",
                  },
                  step_contents: {
                    1: html,
                  },
                  buttons: [],
                };

                let $dlg = $.dialogWizard(
                  $.extend(default_dialog_options, override_options)
                );
                $dlg.reset();
              },
            });
          } else {
            let dialogx_styles = parseBase64Style(
              $(this).data("dialogx-styles")
            );
            let override_options = parseParametersIntoObject(
              $("div[id='" + target_id + "'][data-dw='dialogX']").data(
                "dialogx-options"
              )
            );

            console.log(override_options);
            let default_dialog_options = {
              dialog_styles: $.extend(
                {},
                {
                  ".ui-widget-header": {
                    "background-color": "#0000C9",
                    color: "#fff",
                  },
                  ".ui-dialog-buttonset button": "btn btn-primary",
                },
                dialogx_styles
              ),
              current_step: 1,
              position: {
                at: "center",
                my: "center",
                of: window,
                within: window,
              },
              step_titles: {
                1: "",
              },
              step_contents: {
                1: html,
              },
              step_load: [
                {
                  step: 1,
                  handler: function () {
                    this.applyHooks();
                  },
                },
              ],
              buttons: [],
            };

            let $dlg = $.dialogWizard(
              $.extend(default_dialog_options, override_options)
            );
            $dlg.reset();
          }
        });
      }
    });

    $("div[data-dw='dialogX']").each(function () {
      let $this = $(this);
      let hreftarget = $(
        "a[data-dw='toggle'][data-target='" + $this.attr("id") + "']"
      );
      let alreadySetup = $(hreftarget).data("dialogx-href-setup") != undefined;
      if (alreadySetup) {
        return;
      }
      $(hreftarget).data("dialogx-href-setup", "true");
      $(hreftarget).on("click", function (event) {
        event.preventDefault();

        let target_id = $(this).data("target");
        let html = $("div[id='" + target_id + "'][data-dw='dialogX']").html();

        let get_field_values_url = $(this).data("fetch-field-values-url");
        let field_values_data = {};
        let dialogx_styles = parseBase64Style($(this).data("dialogx-styles"));
        let override_options = parseParametersIntoObject(
          $("div[id='" + target_id + "'][data-dw='dialogX']").data(
            "dialogx-options"
          )
        );
        let field_mappings = parseParametersIntoObject(
          $("div[id='" + target_id + "'][data-dw='dialogX']").data(
            "dialogx-field-mappings"
          )
        );

        if (get_field_values_url != undefined && get_field_values_url != "") {
          let $this = this;
          $.ajax({
            url: get_field_values_url,
            dataType: "json",
            type: "GET",
            success: function (response) {
              field_values_data = response.data;

              console.log(override_options);
              let default_dialog_options = {
                dialog_styles: $.extend(
                  {},
                  {
                    ".ui-widget-header": {
                      "background-color": "#0000C9",
                      color: "#fff",
                    },
                    ".ui-dialog-buttonset button": "btn btn-primary",
                  },
                  dialogx_styles
                ),
                current_step: 1,
                position: {
                  at: "center",
                  my: "center",
                  of: window,
                  within: window,
                },
                step_load: [
                  {
                    step: 1,
                    handler: function () {
                      this.populateFields(field_values_data, field_mappings);
                      this.applyHooks();
                    },
                  },
                ],
                step_titles: {
                  1: "",
                },
                step_contents: {
                  1: html,
                },
                buttons: [],
              };

              let $dlg = $.dialogWizard(
                $.extend(default_dialog_options, override_options)
              );
              $dlg.reset();
            },
          });
        } else {
          let dialogx_styles = parseBase64Style($(this).data("dialogx-styles"));
          let override_options = parseParametersIntoObject(
            $("div[id='" + target_id + "'][data-dw='dialogX']").data(
              "dialogx-options"
            )
          );

          console.log(override_options);
          let default_dialog_options = {
            dialog_styles: $.extend(
              {},
              {
                ".ui-widget-header": {
                  "background-color": "#0000C9",
                  color: "#fff",
                },
                ".ui-dialog-buttonset button": "btn btn-primary",
              },
              dialogx_styles
            ),
            current_step: 1,
            position: {
              at: "center",
              my: "center",
              of: window,
              within: window,
            },
            step_titles: {
              1: "",
            },
            step_contents: {
              1: html,
            },
            step_load: [
              {
                step: 1,
                handler: function () {
                  this.applyHooks();
                },
              },
            ],
            buttons: [],
          };

          let $dlg = $.dialogWizard(
            $.extend(default_dialog_options, override_options)
          );
          $dlg.reset();
        }
      });
    });
  }

  $.extend({
    dialogX: function (options = {}) {
      var ops = $.extend({}, $.fn[NAMESPACE].defaults, options);
      var dwObject = $("<div></div>");
      dwObject.css({
        width: ops.width.length > 0 ? ops.width : "100%",
        height: ops.height.length > 0 ? ops.height : "100%",
      });
      var random_id = Math.random() * 9999;
      ops.dialog_id = "dw_" + moment().valueOf() + "_" + random_id;
      ops.dialog_id = ops.dialog_id.replace(/[.]/g, "_");
      dwObject[0].id = ops.dialog_id;
      $(document.body).append(dwObject);
      // console.log("dwObject ID = " + dwObject[0].id);
      ops.dialogX = true;
      var dlg = $("#" + ops.dialog_id).dw(ops);
      return dlg;
    },
    dialogWizard: function (options = {}) {
      let ops = $.extend({}, $.fn[NAMESPACE].defaults, options);
      // console.log(ops);

      let dlg = $.dialogX(ops);
      let edge = dlg.data("fn." + NAMESPACE);
      // console.log(edge.dialog_id + " " + edge.ops.dialog_id);
      return edge;
    },
    dw: {
      apply: function () {
        applyGlobalHook();
      },
      show: function (id) {
        $(id).dw("reset");
      },
      close: function (id) {
        $(id).dw("close");
      },
      alert: function (msg, title = "Alert") {
        let dlg = $.dialogWizard({
          step_titles: { 1: title },
          step_contents: { 1: msg },
          buttons: [
            {
              step: 1,
              title: "OK",
              handler: function () {
                this.close();
              },
            },
          ],
        });
        dlg.reset();
      },
    },
  });

  /**
   * jQuery plugin defaults
   * @type {Object}
   * @api public
   */
  $.fn[NAMESPACE].defaults = {
    dialogX: false,
    dialog_id: null,
    parent: null,
    dialog_styles: {
      ".ui-widget-header": {
        "background-color": "#0000C9",
        color: "#fff",
      },
      ".ui-dialog-buttonset button": "btn btn-primary",
    },
    dialog_class: "no-close",
    on_close: function () {},
    on_show: function () {},
    max_steps: 1,
    step_titles: {},
    step_contents: {},
    current_step: 1,
    store_form_data: false,
    form_data: {},
    custom_events: [],
    position: {},
    step_load: [],
    buttons: [],
    width: "",
    height: "",
    apply_styles: function () {
      let styles = this.ops.dialog_styles != null ? this.ops.dialog_styles : {};
      for (let style in styles) {
        $(style).each(function () {
          if (typeof styles[style] === "object") {
            $(this).css(styles[style]);
          } else if (typeof styles[style] === "string") {
            $(this).addClass(styles[style]);
          }
        });
      }
    },
    apply_button_types: function () {
      let buttons = this.ops.buttons;
      for (let button_index in buttons) {
        let button = buttons[button_index];
        if (button.type != undefined) {
          let $button = button;
          $(
            "div[aria-describedby='" +
              this.dialog_id +
              "'] .ui-dialog-buttonset button"
          ).each(function () {
            if ($(this).text() == $button.title) {
              $(this).prop("type", $button.type);
              $(this).prop("form", $button.form);
            }
          });
        }
      }
    },
    wrap_contents_with_form: false,
  };

  $(document).ready(function () {
    applyGlobalHook();
  });

  /**
   * jQuery plugin data api
   * @api public
   */
  $(document).on("click." + NAMESPACE, SELECTOR, function (event) {
    var $this = $(this);
    let href = $this.attr("href") || null;

    // $(this)[NAMESPACE]();

    event.preventDefault();

    console.log("opening remote url " + href);

    let dialogx_styles = parseBase64Style($($this).data("dialogx-styles"));

    var dlg = $.dialogWizard({
      dialog_styles: $.extend(
        {},
        {
          ".ui-widget-header": {
            "background-color": "#0000C9",
            color: "#fff",
          },
          ".ui-dialog-buttonset button": "btn btn-primary",
        },
        dialogx_styles
      ),
      buttons: [],
      max_steps: 1,
      step_titles: null,
      position: {
        at: "center",
        my: "center",
        of: window,
        within: window,
      },
      step_contents: {
        1: function (options) {
          var $this = this;
          var $options = options;
          if (href == null) {
            console.log(
              "Could not open remote URL." + JSON.stringify($options)
            );
          } else {
            $.ajaxSetup({ dataType: "html" });
            $.ajax({
              url: href,
              type: "GET",
              success: function (data) {
                $this.setMessageText(1, data);
                $this.applyStyles();
                $(
                  "#" + $options.dialog_id + " button[data-dismiss='modal']"
                ).on("click", function () {
                  $this.close();
                });
              },
            });
          }
        },
      },
    });
    dlg.reset();
  });
})(this, this.document, this.jQuery);
