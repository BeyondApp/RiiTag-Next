import { PUBLIC, CACHE } from '@/lib/constants/filePaths';
import path from 'node:path';
import Canvas from 'canvas';
import fs from "node:fs"
import ModuleBase from '../ModuleBase';
import logger from '@/lib/logger';

export default class Background extends ModuleBase {
    constructor(_) {
        super();
    }

    // async render(ctx: Canvas.CanvasRenderingContext2D, user) {
    //     fs.writeFileSync(path.resolve(CACHE.TAGS, `test.txt`), "Test")
    //     logger.info(`Rendering background for ${user.username}`);
    //     console.log(`Rendering background for ${user.username}`);
    //     const bgPath = path.resolve(PUBLIC.BACKGROUND, user.background);
    //     if (!(await exists(bgPath))) throw new Error(`Background file does not exist: ${bgPath}`);
    //     await ctx.drawImage(await Canvas.loadImage(bgPath), 0, 0);
    // }

    render(ctx: Canvas.CanvasRenderingContext2D, user): any {
        const bgPath = path.resolve(PUBLIC.BACKGROUND, user.background);

        if (!fs.existsSync(bgPath)) {
            logger.error(`Background image does not exist: ${bgPath}`);
            this.events.emit("rendered");
        }
        
        Canvas.loadImage(bgPath).then((image) => {
            ctx.drawImage(image, 0, 0);
            this.events.emit("rendered");
        });
    }
}