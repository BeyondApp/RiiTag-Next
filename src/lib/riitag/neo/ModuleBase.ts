import logger from "@/lib/logger";
import Canvas from "canvas";
import { EventEmitter } from "node:events";

export default class ModuleBase {
    events: EventEmitter;

    constructor() {
        this.events = new EventEmitter();
    }

    render(ctx: Canvas.CanvasRenderingContext2D, user: any): any {
        logger.error("ModuleBase.render() not implemented");
        this.events.emit("rendered");
    }
}