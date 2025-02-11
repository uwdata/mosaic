import { MosaicClient } from "@uwdata/mosaic-core/src/MosaicClient.js";
import { InstantiateContext } from "@uwdata/mosaic-spec";
import { Canvas } from "skia-canvas";

export function mockCanvas(window: any) {
    const og = window.document.createElement
    window.document.createElement = function (tagName: string) {
        if (tagName !== 'canvas') {
            return og.call(this, tagName)
        } else {
            const canvas = new Canvas();
            const el = og.call(this, tagName) as HTMLCanvasElement;
            el.getContext = canvas.getContext.bind(canvas) as unknown as HTMLCanvasElement['getContext'];
            el.toDataURL = canvas.toDataURLSync.bind(canvas);
            const set = el.setAttribute;
            el.setAttribute = function (name: string, value: string) {
                if (name !== 'width' && name !== 'height') {
                    set.call(this, name, value);
                } else {
                    canvas[name] = parseInt(value);
                }
            }
            return el;
        }
    }
}

export function clientsReady(ctx: InstantiateContext) {
    const clients = [...ctx.coordinator.clients] as MosaicClient[];
    return Promise.allSettled(clients.map(c => c.pending));
}