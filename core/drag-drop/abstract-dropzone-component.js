/*global require, exports, document, Error*/

var Component = require("montage/ui/component").Component,
    DragDropComponentManager = require('core/drag-drop/drag-drop-component-manager').defaultDragDropComponentManager;

/**
 * @class AbstractDropZoneComponent
 * @abstract
 *
 * @extends Component
 *
 */
exports.AbstractDropZoneComponent = Component.specialize( /** @lends AbstractDropZoneComponent# */ {


    _acceptDrop: {
        value: false
    },


    acceptDrop: {
        set: function (value) {
            if (typeof value === "boolean" && this._acceptDrop !== value) {
                this._acceptDrop = value;

                this.needsDraw = true;
            }
        },
        get: function () {
            return this._acceptDrop;
        }
    },


    _uid: {
        value: null
    },


    uid: {
        get: function () {
            return this._uid || (this._uid = DragDropComponentManager.constructor.generateUID());
        }
    },

    scrollThreshold: {
        value: 40
    },

    _willAcceptDrop: {
        value: false
    },


    willAcceptDrop: {
        set: function (value) {
            if (typeof value === "boolean" && this._willAcceptDrop !== value) {
                this._willAcceptDrop = value;

                this.needsDraw = true;
            }
        },
        get: function () {
            return this._willAcceptDrop;
        }
    },


    _boundingRect: {
        value: null
    },


    enterDocument: {
        value: function (firstime) {
            if (firstime) {
                this.classList.add("montage--DropZone");
            }

            DragDropComponentManager.registerDropZoneComponent(this);
        }
    },


    exitDocument: {
        value: function () {
            DragDropComponentManager.releaseDropZoneComponent(this);
        }
    },


    handleComponentDragStart: {
        value: function (draggableComponent, dragStartEvent) {
            this.willAcceptDrop = this._shouldAcceptComponent(draggableComponent, dragStartEvent);
        }
    },

    handleComponentDrop: {
        value: function (draggableComponent) {
            if (this._acceptDrop) {
                draggableComponent.hasBeenDropped = true;
                draggableComponent.dropZoneDropped = this;

                if (typeof this.didComponentDrop === "function") {
                    this.didComponentDrop(draggableComponent);
                }
            }
        }
    },


    handleComponentDragEnd: {
        value: function (draggableComponent, dragEndEvent) {
            if (this._willAcceptDrop || this._acceptDrop) {
                if (typeof this.didComponentDragEnd === "function") {
                    this.didComponentDragEnd(draggableComponent, dragEndEvent);
                }

                this.willAcceptDrop = false;
                this.acceptDrop = false;
                this._boundingRect = null;
                this._spacerElementBoundingRect = null;
            }
        }
    },


    handleFilesDragStart: {
        value: function (dragStartEvent) {
            this.willAcceptDrop = this._shouldAcceptFiles(dragStartEvent);

            if (this._willAcceptDrop) {
                this._element.addEventListener("dragover", this, false);
            }
        }
    },


    handleDragover: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;

            if (!this._acceptDrop) {
                if (this._willAcceptDrop) {
                    event.preventDefault();

                    dataTransfer.dropEffect = dataTransfer.effectAllowed;
                    this.acceptDrop = true;

                    this._element.addEventListener("dragleave", this, false);
                    this._element.addEventListener("drop", this, false);
                } else {
                    dataTransfer.dropEffect = "none";
                }
            } else { // Component is already accepting drop.
                event.preventDefault();

            }
        }
    },


    handleDrop: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;

            if (this._acceptDrop) {
                if (dataTransfer && dataTransfer.types && dataTransfer.types.has("Files")) {
                    event.preventDefault();

                    if (typeof this.didFilesDrop === "function") {
                        this.didFilesDrop(dataTransfer.files, event);
                    }
                }

                this.acceptDrop = false;
                this.willAcceptDrop = false;

                this._element.removeEventListener("dragover", this, false);
                this._removeFileListeners();
            }
        }
    },


    handleDragleave: {
        value: function (event) {
            if (typeof this.didDragFileLeave === "function") {
                this.didDragFileLeave(event);
            }

            this.acceptDrop = false;
            this._removeFileListeners();
        }
    },


    handleFilesDragEnd: {
        value: function (event) {
            if (this._willAcceptDrop || this._acceptDrop) {
                if (typeof this.didDragFileEnd === "function") {
                    this.didDragFileEnd(event);
                }

                this.willAcceptDrop = false;
                this.acceptDrop = false;
                this._boundingRect = null;

                this._element.removeEventListener("dragover", this, false);
            }
        }
    },


    _removeFileListeners: {
        value: function () {
            this._element.removeEventListener("dragleave", this, false);
            this._element.removeEventListener("drop", this, false);
        }
    },


    _shouldAcceptComponent: {
        value: function (component, event) {
            var shouldAcceptComponent = true;

            if (typeof this.shouldAcceptComponent === "function") {
                shouldAcceptComponent = this.shouldAcceptComponent(component, event);
            }

            return shouldAcceptComponent;
        }
    },


    _shouldAcceptFiles: {
        value: function (event) {
            var dataTransfer = event.dataTransfer,
                shouldAcceptFile = false;

            if (dataTransfer) {
                var mimeTypes = dataTransfer.types;

                if (mimeTypes && mimeTypes.has("Files") && typeof this.shouldAcceptFiles === "function") {
                    shouldAcceptFile = this.shouldAcceptFiles(event);
                }
            }

            return shouldAcceptFile;
        }
    },


    


    willDraw: {
        value: function () {
            if (this._willAcceptDrop && !this._boundingRect) {
                this._boundingRect = this._element.getBoundingClientRect();
            }

            if (this.acceptDrop && this.autoScrollView && !this._spacerElementBoundingRect) {
                this._spacerElementBoundingRect = this.scrollView.spacerElement.getBoundingClientRect();
            }
        }
    },


    draw: {
        value: function () {
            if (this._willAcceptDrop && this._acceptDrop) {
                this._element.classList.remove("willAcceptDrop");
                this._element.classList.add("acceptDrop");

            } else if (this._willAcceptDrop) {
                this._element.classList.remove("acceptDrop");
                this._element.classList.add("willAcceptDrop");

            } else {
                this._element.classList.remove("acceptDrop");
                this._element.classList.remove("willAcceptDrop");
            }

            if (this.acceptDrop) {
                var spacerElementBoundingRect = this._spacerElementBoundingRect,
                    scrollThreshold = this.scrollThreshold;

                if (this.autoScrollView) {
                    if (this.scrollView._hasVerticalScrollbar) {
                        this.multiplierY = 0;

                        if (spacerElementBoundingRect.top <= this.scrollViewPointerPositionY &&
                            spacerElementBoundingRect.top + scrollThreshold > this.scrollViewPointerPositionY) {

                            this.multiplierY = scrollThreshold / (this.scrollViewPointerPositionY - spacerElementBoundingRect.top);

                        } else if (spacerElementBoundingRect.bottom >= this.scrollViewPointerPositionY &&
                            this.scrollViewPointerPositionY >= spacerElementBoundingRect.bottom - scrollThreshold ) {

                            this.multiplierY = scrollThreshold / (spacerElementBoundingRect.bottom - this.scrollViewPointerPositionY);
                        }
                        // Change the algorithm for speed scrolling.
                        this.multiplierY = this.multiplierY * 2;
                    }

                    if (this.scrollView._hasHorizontalScrollbar) {
                        this.multiplierX = 0;

                        if (spacerElementBoundingRect.left <= this.scrollViewPointerPositionX &&
                            spacerElementBoundingRect.left + scrollThreshold > this.scrollViewPointerPositionX) {

                            this.multiplierX = scrollThreshold / (this.scrollViewPointerPositionX - spacerElementBoundingRect.left);

                        } else if (spacerElementBoundingRect.right >= this.scrollViewPointerPositionY &&
                            this.scrollViewPointerPositionX >= spacerElementBoundingRect.right - scrollThreshold ) {

                            this.multiplierX = scrollThreshold / (spacerElementBoundingRect.right - this.scrollViewPointerPositionX);
                        }

                        this.multiplierX = this.multiplierX * 2;
                    }

                    this.autoScrollView = false;
                    this.needsUpdateScrollView = !!this.multiplierY || !!this.multiplierX;
                }

                if (this.needsUpdateScrollView) {
                    if (this.scrollView._hasVerticalScrollbar) {
                        this.needsUpdateScrollView = false;

                        if (spacerElementBoundingRect.top + scrollThreshold > this.scrollViewPointerPositionY) {
                            this.scrollView.scrollTop = this.scrollView.scrollTop - (1 * this.multiplierY);
                            this.needsUpdateScrollView = this.scrollView.scrollTop !== 0;
                        } else if (this.scrollViewPointerPositionY >= spacerElementBoundingRect.bottom - scrollThreshold ) {
                            this.scrollView.scrollTop = this.scrollView.scrollTop + (1 * this.multiplierY);
                            this.needsUpdateScrollView = this.scrollView.scrollTop !== this.scrollView._maxTranslateY;
                        }
                    }

                    if (this.scrollView._hasHorizontalScrollbar) {
                        this.needsUpdateScrollView = this.needsUpdateScrollView || false;

                        if (spacerElementBoundingRect.left + scrollThreshold > this.scrollViewPointerPositionX) {
                            this.scrollView.scrollLeft = this.scrollView.scrollLeft - (1 * multiplier);
                            this.needsUpdateScrollView = this.scrollView.scrollLeft !== 0;
                        } else if (this.scrollViewPointerPositionX >= spacerElementBoundingRect.right - scrollThreshold ) {
                            this.scrollView.scrollLeft = this.scrollView.scrollLeft + (1 * multiplier);
                            this.needsUpdateScrollView = this.scrollView.scrollLeft !== this.scrollView._maxTranslateX;
                        }
                    }
                }

                if (this.needsUpdateScrollView ) {
                    this.needsDraw = true;
                }
            }
        }
    }

});
