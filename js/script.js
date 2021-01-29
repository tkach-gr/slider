class ComponentFinder {
    static findByClass(obj, className) {
        let children = obj.children;
        
        for(let i = 0; i < children.length; i++) {
            let child = children[i];
    
            if (child.classList.contains(className)) {
                return child;
            }
        }
    }
}

class PropertyManager {
    static isDigit(symb) {
        let parsed = parseInt(symb);
        if (isNaN(parsed)) { return false; }
        return true;
    }

    static findDigitStart(str) {
        for(let i = 0; i < str.length; i++) {
            if(this.isDigit(str[i]) || str[i] === '-') {
                return i;
            }
        }
    }

    static copyDigit(str, start) {
        let result = "";

        for(let i = start; ; i++) {
            result += str[i];

            if(i + 1 >= str.length || this.isDigit(str[i + 1]) !== true) {
                return { result, end: i + 1 };
            }
        }
    }

    static getValue(str) {
        let start = this.findDigitStart(str);

        if(start === undefined) { return null; }

        let { result, end } = this.copyDigit(str, start);

        return {
            value: parseInt(result),
            start,
            end
        }
    }

    static changeValue(obj, prop, difference) {
        let { value, start, end } = this.getValue(obj[prop]);
        let newProp = obj[prop].split("");
        newProp.splice(start, end - start, (value + difference));
        newProp = newProp.join("");

        obj[prop] = newProp;
    }

    static setValue(obj, prop, value) {
        let { start, end } = this.getValue(obj[prop]);
        let newProp = obj[prop].split("");
        newProp.splice(start, end - start, value);
        newProp = newProp.join("");
        
        obj[prop] = newProp;
    }
}

class PointerEventHandler {
    constructor(source, down, move, up, leave) {
        this.source = source;
        let handler = this;

        this.down = e => {
            down(e);
            handler.subscribe(); 
        };

        this.move = move;

        this.up = e => {
            handler.unsubscribe();
            up(e);
        };

        this.leave = e => {
            handler.unsubscribe();
            leave(e);
        };

        this.source.addEventListener("pointerdown", this.down);
    }

    subscribe() {
        this.source.addEventListener("pointermove", this.move);
        this.source.addEventListener("pointerup", this.up);
        this.source.addEventListener("pointerleave", this.leave);
    }

    unsubscribe() {
        this.source.removeEventListener("pointermove", this.move);
        this.source.removeEventListener("pointerup", this.up);
        this.source.removeEventListener("pointerleave", this.leave);
    }
}

class SliderSwipeEventHandler {
    constructor(slider) {
        this.slider = slider;
        let sliderHandler = this;
        new PointerEventHandler(
            slider.source,
            e => sliderHandler.handleDownEvent(e),
            e => sliderHandler.handleMoveEvent(e),
            e => sliderHandler.handleUpEvent(e),
            e => sliderHandler.handleLeaveEvent(e)
        );
    }

    handleDownEvent(event) {
        event.preventDefault();
        this.start = event.clientX;
    }

    handleMoveEvent(event) {
        let end = event.clientX;
        this.slider.movePoint(-(Math.round(end - this.start)), false);
        this.start = end;
    }

    handleUpEvent(event) {
        let slider = this.slider;
        slider.point.classList.add("slider__smooth");

        let end = event.clientX;
        slider.movePoint(-(end - this.start));

        setTimeout(() => slider.point.classList.remove("slider__smooth"), 500);
    }

    handleLeaveEvent(event) {
        this.handleUpEvent(event);
    }
}

class Slider {
    constructor(obj) {
        this.source = obj;
        this.point = ComponentFinder.findByClass(this.source, "slider__point");
        this.storage = {
            first: ComponentFinder.findByClass(this.point, "slider__wrapper"),
            second: ComponentFinder.findByClass(this.point, "slider__wrapper_second")
        };
        this.pointWidth = this.point.clientWidth;
        this.elCount = this.storage.first.children.length;
        this.localCount = 0;

        this.setDefault();

        // let slider = this;
        // window.addEventListener("resize", () => {
        //     slider.customizeSizes();
        // });
    }

    customizeSizes() {
        // let style = this.source.style;
        // let width = this.source.clientWidth;
        // let computedStyle = getComputedStyle(this.source);
        // let leftMargin = parseInt(computedStyle.marginLeft);
        // let rigthMargin = parseInt(computedStyle.marginRight);
        // style.height = ((width + leftMargin + rigthMargin) / 100 * 56.25) + "px";
    }

    setDefault() {
        this.point.style.left = "0px";
        //set point's width and height

        let firstLength = this.storage.first.children.length;
        this.storage.first.style.width = firstLength + "00%";
        this.storage.first.style.left = "0%";

        let secondLength = this.storage.second.children.length;
        this.storage.second.style.width = secondLength + "00%";
        this.storage.second.style.left = -secondLength + "00%";
    }

    swapElements({ first, second, side }) {
        if(side === "left") {
            let el = first.removeChild(first.lastElementChild);
            second.prepend(el);

            let temp = first;
            first = second;
            second = temp;
        } else if (side === "right") {
            let el = second.removeChild(second.firstElementChild);
            first.appendChild(el);
        }
    }

    dragContainers({ first, second, side }) {
        if(side >= 0) { 
            side = 1; 
        } else if(side < 0) { 
            side = -1;
            let temp = first;
            first = second;
            second = temp;
        }

        PropertyManager.changeValue(second.style, "width", -100);
        PropertyManager.changeValue(first.style, "width", 100);

        if(side > 0) {
            PropertyManager.changeValue(second.style, "left", 100);
        } else {
            PropertyManager.changeValue(first.style, "left", -100);
        }
    }

    moveElements(elToMove) {
        for(let i = 0; i < Math.abs(elToMove); i++) {
            if(elToMove > 0) {
                let second = this.storage.second;
                if(second.children.length <= 0) {
                    let containerShift = this.elCount * 2;
                    PropertyManager.changeValue(second.style, "left", containerShift * 100);

                    let temp = this.storage.second;
                    this.storage.second = this.storage.first;
                    this.storage.first = temp;
                }
            } else {
                let first = this.storage.first;
                if(first.children.length <= 0) {
                    let containerShift = this.elCount * 2;
                    PropertyManager.changeValue(first.style, "left", containerShift * -100);

                    let temp = this.storage.second;
                    this.storage.second = this.storage.first;
                    this.storage.first = temp;
                }
            }

            let first = this.storage.first;
            let second = this.storage.second;
            
            if(elToMove > 0) { this.swapElements({ first, second, side: "right" }); }
            else if(elToMove < 0) { this.swapElements({ first, second, side: "left" }); }

            this.dragContainers({ first, second, side: elToMove });
        }
    }

    movePoint(shift, anchor = true) {
        let point = this.point;
        let { value: left  } = PropertyManager.getValue(point.style["left"]);
        let count = (left - shift) / this.pointWidth;
        let elToMove = 0;

        if(anchor) {
            shift = left - (Math.round(count) * this.pointWidth); 
            count = (left - shift) / this.pointWidth;
        }

        count = count > 0 ? Math.floor(count) : Math.ceil(count);

        if(this.localCount !== count) {
            elToMove = this.localCount - count; 
            this.localCount = count;
        }
        
        PropertyManager.changeValue(point.style, "left",  -shift);

        this.moveElements(elToMove);
    }

    start() {
        new SliderSwipeEventHandler(this);
    }
}

let sliderObj = document.getElementsByClassName("slider__content")[0];
let slider = new Slider(sliderObj);
slider.start();
