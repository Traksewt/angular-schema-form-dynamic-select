angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var select = function (name, schema, options) {
                if ((schema.type === 'string') && ("enum" in schema)) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'strapselect';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(select);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'strapselect',
                'directives/decorators/bootstrap/strap/strapselect.html');
            schemaFormDecoratorsProvider.createDirective('strapselect',
                'directives/decorators/bootstrap/strap/strapselect.html');

            schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'strapmultiselect',
                'directives/decorators/bootstrap/strap/strapmultiselect.html');
            schemaFormDecoratorsProvider.createDirective('strapmultiselect',
                'directives/decorators/bootstrap/strap/strapmultiselect.html');

            schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'strapselectdynamic',
                'directives/decorators/bootstrap/strap/strapselect.html');
            schemaFormDecoratorsProvider.createDirective('strapselectdynamic',
                'directives/decorators/bootstrap/strap/strapselect.html');

            schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'strapmultiselectdynamic',
                'directives/decorators/bootstrap/strap/strapmultiselect.html');
            schemaFormDecoratorsProvider.createDirective('strapmultiselectdynamic',
                'directives/decorators/bootstrap/strap/strapmultiselect.html');


            // UI SELECT
            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'uiselect',
                'directives/decorators/bootstrap/uiselect/uiselect.html')

            schemaFormDecoratorsProvider.createDirective('uiselect',
                'directives/decorators/bootstrap/uiselect/uiselect.html');

            schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'uiselectmultiple',
                'directives/decorators/bootstrap/uiselect/uiselectmultiple.html')

            schemaFormDecoratorsProvider.createDirective('uiselectmultiple',
                'directives/decorators/bootstrap/uiselect/uiselectmultiple.html');

        }])
  .directive("toggleSingleModel", function() {
    // some how we get this to work ...
    return {
      require: 'ngModel',
      restrict: "A",
      scope: {},
      replace: true,
      controller: ['$scope', function($scope)  {
        $scope.$parent.$watch('select_model.selected',function(){
          if($scope.$parent.select_model.selected != undefined) {
            $scope.$parent.insideModel = $scope.$parent.select_model.selected.value;
            $scope.$parent.ngModel.$setViewValue($scope.$parent.select_model.selected.value);
          }
        });
      }]
    };
  })
  .directive("toggleModel", function() {
    // some how we get this to work ...
    return {
      require: 'ngModel',
      restrict: "A",
      scope: {},
      controller: ['$scope','sfSelect', function($scope,  sfSelect)  {
        var list = sfSelect($scope.$parent.form.key, $scope.$parent.model);
        //as per base array implemenation if the array is undefined it must be set as empty for data binding to work
        if (angular.isUndefined(list)) {
            list = [];
            sfSelect($scope.$parent.form.key, $scope.$parent.model, list);
        }
        $scope.$parent.$watch('form.select_models',function(){
          if (!($scope.$parent.form.select_models)) {
            // The select models has not yet been assigned. Do nothing.
          } else
          if($scope.$parent.form.select_models.length == 0) {
            $scope.$parent.insideModel = $scope.$parent.$$value$$;
            if($scope.$parent.ngModel.$viewValue != undefined) {
              $scope.$parent.ngModel.$setViewValue($scope.$parent.form.select_models);
            }
          } else {
            $scope.$parent.insideModel = $scope.$parent.form.select_models;
            $scope.$parent.ngModel.$setViewValue($scope.$parent.form.select_models);
          }
        }, true);
      }]
    };
  })
  .directive('multipleOn', function() {
    return {
    link: function($scope, $element, $attrs) {
        $scope.$watch(
            function () { return $element.attr('multiple-on'); },
            function (newVal) {

                if(newVal == "true") {
                    var select_scope = angular.element($element).scope().$$childTail;
                    select_scope.$isMultiple = true;
                    select_scope.options.multiple = true;
                    select_scope.$select.$element.addClass('select-multiple');
                }
                else {
                    angular.element($element).scope().$$childTail.$isMultiple = false;
                }
            }
        );
      }
    };
  })
  .filter('whereMulti', function() {
    return function(items, key, values) {
      var out = [];

      if (angular.isArray(values)) {
          values.forEach(function (value) {
              for (var i = 0; i < items.length; i++) {
                  if (value == items[i][key]) {
                      out.push(items[i]);
                      break;
                  }
              }
          });
      } else {
        // Let the output be the input untouched
        out = items;
      }

      return out;
    };
  })
  .filter('propsFilter', function() {
        return function (items, props) {
            var out = [];

            if (angular.isArray(items)) {
                items.forEach(function (item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        if (item.hasOwnProperty(prop)) {
                            //only match if this property is actually in the item to avoid
                            var text = props[prop].toLowerCase();
                            //search for either a space before the text or the textg at the start of the string so that the middle of words are not matched
                            if (item[prop].toString().toLowerCase().indexOf(text) === 0 || ( item[prop].toString()).toLowerCase().indexOf(' ' + text) !== -1) {
                                itemMatches = true;
                                break;
                            }
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    });

angular.module('schemaForm').controller('dynamicSelectController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {


    $scope.triggerItems = function () {
        console.log("listener triggered");
        $scope.$$watchers.forEach(function (watcher) {
            if (watcher.exp == "form.titleMap") {
                watcher.fn($scope.form.titleMap, $scope.form.titleMap)
            }
        });

    };

    $scope.initFiltering = function (localModel) {
        if ($scope.form.options.filterTriggers) {
            $scope.form.options.filterTriggers.forEach(function (trigger) {
                $scope.$watch(trigger, $scope.triggerItems)

            });
        }
        // This is set here, as the model value may become unitialized and typeless if validation fails.
        $scope.localModelType =  Object.prototype.toString.call(localModel);
        $scope.filteringInitialized = true;
    };


    $scope.remap = function (options, data) {
        if (options && "map" in options && options.map) {
            var current_row = null;
            var result = [];
            data.forEach(function (current_row) {
                current_row["value"] = current_row[options.map.valueProperty];
                current_row["name"] = current_row[options.map.nameProperty];
                result.push(current_row);
            });
            return result;

        }
        else {
            data.forEach(function (item) {
                    if ("text" in item) {
                        item.name = item.text
                    }
                }
            );
            return data;
        }
    };

    $scope.clone = function (obj) {
        if (null == obj || "object" != typeof(obj)) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = $scope.clone(obj[attr]);
        }
        return copy;
    };


    $scope.getCallback = function (callback, name) {
        if (typeof(callback) == "string") {
            var _result = $scope.$parent.evalExpr(callback);
            if (typeof(_result) == "function") {
                return _result;
            }
            else {
                throw("A callback string must match name of a function in the parent scope")
            }

        }
        else if (typeof(callback) == "function") {
            return callback;
        }
        else {
            throw("A callback must either be a string matching the name of a function in the parent scope or a " +
            "direct function reference")

        }
    };

    $scope.getOptions = function (options) {
        // If defined, let the a callback function manipulate the options
        if (options.httpPost && options.httpPost.optionsCallback) {
            newOptionInstance = $scope.clone(options);
            return $scope.getCallback(options.httpPost.optionsCallback)(newOptionInstance);
        }
        if (options.httpGet && options.httpGet.optionsCallback) {
            newOptionInstance = $scope.clone(options);
            return $scope.getCallback(options.httpGet.optionsCallback)(newOptionInstance);
        }
        else {
            return options;
        }
    };

    $scope.fetchResult = function (form) {

        if ("enum" in form.schema) {
            form.titleMap = [];
            form.schema.enum.forEach(function (item) {
                    form.titleMap.push({"value": item, "name": item})
                }
            );

        } else if (form.titleMap) {
            console.log("dynamicSelectController.fetchResult : There is already a titleMap");
        }
        else if (!form.options) {

            console.log("dynamicSelectController.fetchResult : No options set, needed for dynamic selects");
        }
        else if (form.options.callback) {

            $scope.form.titleMap = $scope.getCallback(form.options.callback)(form.options);
            console.log('callback items', form.titleMap);
        }
        else if (form.options.asyncCallback) {
            return $scope.getCallback(form.options.asyncCallback)(form.options).then(
                function (_data) {
                    form.titleMap = $scope.remap(form.options, _data.data);
                    console.log('asyncCallback items', form.titleMap);
                },
                function (data, status) {
                    alert("Loading select items failed(Options: '" + String(form.options) +
                    "\nError: " + status);
                });
        }
        else if (form.options.httpPost) {
            var finalOptions = $scope.getOptions(form.options);

            return $http.post(finalOptions.httpPost.url, finalOptions.httpPost.parameter).then(
                function (_data) {

                    form.titleMap = $scope.remap(finalOptions, _data.data);
                    console.log('httpPost items', form.titleMap);
                },
                function (data, status) {
                    alert("Loading select items failed (URL: '" + String(finalOptions.httpPost.url) +
                    "' Parameter: " + String(finalOptions.httpPost.parameter) + "\nError: " + status);
                });
        }
        else if (form.options.httpGet) {
            var finalOptions = $scope.getOptions(form.options);
            return $http.get(finalOptions.httpGet.url, finalOptions.httpGet.parameter).then(
                function (data) {
                    form.titleMap = $scope.remap(finalOptions, data.data);
                    console.log('httpGet items', form.titleMap);
                },
                function (data, status) {
                    alert("Loading select items failed (URL: '" + String(finalOptions.httpGet.url) +
                    "\nError: " + status);
                });

        }

    };


}]);

angular.module('schemaForm').filter('selectFilter', [function ($filter) {
    return function (inputArray, controller, localModel, strLocalModel) {
        // As the controllers' .model is the global and its form is the local, we need to get the local model as well.
        // We also need tp be able to set it if is undefined after a validation failure,so for that we need
        // its string representation as well as we do not know its name. A typical value if strLocalModel is model['groups']
        // This is very ugly, though. TODO: Find out why the model is set to undefined after validation failure.

        if (!angular.isDefined(inputArray) || !angular.isDefined(controller.form.options) ||
            !angular.isDefined(controller.form.options.filter) || controller.form.options.filter == '') {
            return inputArray;
        }

        console.log("----- In filtering for " + controller.form.key + "(" + controller.form.title +"), model value: " + JSON.stringify( localModel) + "----");
        console.log("Filter:" + controller.form.options.filter);
        if (!controller.filteringInitialized) {
            console.log("Initialize filter");
            controller.initFiltering(localModel);
        }
        var data = [];


        angular.forEach(inputArray, function (curr_item) {
            console.log("Compare: curr_item: " + JSON.stringify(curr_item) +
            "with : " + JSON.stringify( controller.$eval(controller.form.options.filterTriggers[0])));
            if (controller.$eval(controller.form.options.filter, {item: curr_item})) {
                data.push(curr_item);
            }
            else if (localModel) {
                // If not in list, also remove the set value

                if (controller.localModelType == "[object Array]") {
                    localModel.splice(localModel.indexOf(curr_item.value), 1);
                }
                else if (localModel == curr_item.value) {
                    console.log("Setting model of type " + controller.localModelType  + "to null.");
                    localModel = null;
                }
            }
        });

        if (controller.localModelType == "[object Array]" && !localModel) {
            // An undefined local model seems to mess up bootstrap select's indicators
            console.log("Resetting model of type " + controller.localModelType  + " to [].");

            controller.$eval(strLocalModel + "=[]");
        }

        console.log("Input: " + JSON.stringify(inputArray));
        console.log("Output: " + JSON.stringify(data));
        console.log("Model value out : " + JSON.stringify(localModel));
        console.log("----- Exiting filter for " + controller.form.title + "-----");

        return data;
    };
}]);





