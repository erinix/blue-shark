/**
 * @module ui/multiple-select.reel
 */
var Component = require("montage/ui/component").Component,
    KeyComposer = require("montage/composer/key-composer").KeyComposer;

/**
 * @class MultipleSelect
 * @extends Component
 */
exports.MultipleSelect = Component.specialize(/** @lends MultipleSelect# */ {
    values: {
        value: null
    },

    options: {
        value: null
    },

    converter: {
        value: null
    },

    _inputError: {
        value: null
    },

    __selectedOption: {
        value: null
    },

    _selectedOption: {
        get: function() {
            return this.__selectedOption;
        },
        set: function(option) {
            if (option && this.__selectedOption != option) {
                this.__selectedOption = option;
                this._selectOption(option);
            }
        }
    },

    _valueToAdd: {
        get: function() {
            return null;
        },
        set: function(value) {
            if (value) {
                this._addValueToContent(value);
                this._clearInput();
                this._stopScrollingOptions();
            }
        }
    },

    enterDocument: {
        value: function() {
            if (!this.values) {
                this.values = [];
            }
            if (!this.options) {
                this.options = [];
            }
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this._inputField.delegate = {
                shouldAcceptValue: function() {
                    return true;
                }
            };
            KeyComposer.createKey(this._inputField, "down", "down").addEventListener("keyPress", this);
            KeyComposer.createKey(this._inputField, "up", "up").addEventListener("keyPress", this);
        }
    },

    handleClearButtonAction: {
        value: function () {
            this._clearInput();
        }
    },

    _blurInputField: {
        value: function () {
            this._inputField.element.blur();
        }
    },

    handleInputAction: {
        value: function() {
            if (this._inputField.value) {
                if (this._addValueToContent(this._inputField.value)) {
                    this._blurInputField();
                    this._clearInput();
                }
            }
        }
    },

    handleDownKeyPress: {
        value: function(event) {
            switch (event.target.component) {
                case this._inputField:
                    if (this.options && this.options.length > 0) {
                        this._navigateInOptions(1)
                    }
                    break;
            }
        }
    },

    handleUpKeyPress: {
        value: function(event) {
            switch (event.target.component) {
                case this._inputField:
                    if (this.options && this.options.length > 0) {
                        this._navigateInOptions(-1);
                    }
                    break;
            }
        }
    },

    _selectOption: {
        value: function (option) {
            this._isScrollingOptions = true;
            this._optionsController.select(option);
            this._inputField.value = this._optionsController.selection[0].label;
            this._selectedOption = option;
        }
    },

    _stopScrollingOptions: {
        value: function () {
            this._optionsController.clearSelection();
            this._selectedOption = null;
            this._isScrollingOptions = false;
        }
    },

    _navigateInOptions: {
        value: function(distance) {
            var currentIndex = this._optionsController.organizedContent.indexOf(this._optionsController.selection[0]),
                newIndex = currentIndex + distance,
                contentLength = this._optionsController.organizedContent.length;
            if (newIndex < -1) {
                newIndex = contentLength -1;
            }
            if (newIndex == -1 || newIndex == contentLength) {
                this._inputField.value = this._typedValue;
                this._stopScrollingOptions();
            } else {
                this._selectOption(this._optionsController.organizedContent[newIndex % contentLength]);
            }
        }
    },

    _clearInput: {
        value: function() {
            this._inputField.value = null;
        }
    },

    _addValueToContent: {
        value: function(value) {
            var isValid = true;

            if (this.converter) {
                if (this.converter.validator && typeof this.converter.validator.validate === 'function') {
                    isValid = this.converter.validator.validate(value);
                }
                if (isValid) {
                    this._inputError = false;
                    if (typeof this.converter.revert === 'function') {
                        value = this.converter.revert(value);
                    }
                } else {
                    this._inputError = true;
                }
            }
            if (isValid) {
                this.values.push(value);
            }
            return isValid;
        }
    }
});