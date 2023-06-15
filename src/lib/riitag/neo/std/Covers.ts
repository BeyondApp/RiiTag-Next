import prisma from '@/lib/db';
import ModuleBase from '../ModuleBase';
import CONSOLE from '@/lib/constants/console';
import { CACHE, DATA } from '@/lib/constants/filePaths';
import path from 'node:path';
import COVER_TYPE from '@/lib/constants/coverType';
import fs from 'node:fs';
import { saveFile } from '@/lib/utils/fileUtils';
import Canvas from 'canvas';
const xml2js = require('xml2js');

export default class Covers extends ModuleBase {
    x: number;
    y: number;
    width: number;
    height: number;
    increment_x: number;
    increment_y: number;
    max: number;

    constructor(overlay) {
        super()

        this.x = overlay.covers.x;
        this.y = overlay.covers.y;
        this.width = overlay.covers.width;
        this.height = overlay.covers.height;
        this.increment_x = overlay.covers.increment_x;
        this.increment_y = overlay.covers.increment_y;
        this.max = overlay.covers.max;
    }

    findRegionByGameId(gameId, games) {
        let regions = null;
        games.forEach(game => {
          if (game.id[0] === gameId) {
            regions = game.region[0].split(',').map(region => region.trim());
          }
        });
        return regions;
      }

    get3DSGameRegion(gameId) {
        switch (gameId.charAt(3)) {
            case 'P': {
              return 'EN';
            }
            case 'E': {
              return 'US';
            }
            case 'J': {
              return 'JA';
            }
            case 'K': {
              return 'KO';
            }
            case 'W': {
              return 'ZH';
            }
            default: {
              return 'EN';
            }
        }
    }

    getWiiGameRegion(gameId) {
        switch (gameId.charAt(3)) {
          case 'P': {
            return 'EN';
          }
          case 'E': {
            return 'US';
          }
          case 'J': {
            return 'JA';
          }
          case 'K': {
            return 'KO';
          }
          case 'W': {
            return 'TW';
          }
          default: {
            return 'EN';
          }
        }
    }

    async getSwitchGameRegion(gameId) {
        const ids = JSON.parse(
          await fs.promises.readFile(path.resolve(DATA.IDS, 'switchtdb.json'), 'utf8')
        );
      
        try {
          const data = await fs.promises.readFile(
            path.resolve(DATA.IDS, 'switchtdb.xml'),
            'utf-8'
          );
      
          const result: any = await new Promise((resolve, reject) => {
            xml2js.parseString(data, (parseErr, parseResult) => {
              if (parseErr) {
                reject(parseErr);
              } else {
                resolve(parseResult);
              }
            });
          });
      
          const games = result.datafile.game;
      
          const region = this.findRegionByGameId(gameId, games);
      
          for (const gameRegion of region) {
            // Europe
            if (gameRegion === "FRA") {
              return "FR";
            }
            if (gameRegion === "DEU") {
              return "DE";
            }
            if (gameRegion === "ESP") {
              return "ES";
            }
            if (gameRegion === "AUS") {
              return "AU";
            }
            if (gameRegion === "EUR") {
              return "EN";
            }
            if (gameRegion === "KOR") {
              return "KO";
            }
            if (gameRegion === "TWN") {
              return "TW";
            }
      
            // Japan
            if (gameRegion === "JPN") {
              return "JP";
            }
      
            // USA
            if (gameRegion === "USA") {
              return "US";
            }
      
            if (gameRegion === "ALL") {
              return "EN";
            }
          }
      
          return null; // Game ID not found
        } catch (error) {
          console.error(error);
          return null;
        }
      }

    async getGameRegion(console, gameId) {
        switch(console) {
            case CONSOLE.THREEDS:
                return this.get3DSGameRegion(gameId);
            case CONSOLE.SWITCH:
                return await this.getSwitchGameRegion(gameId);
            case CONSOLE.WII:
            case CONSOLE.WII_U:
                return this.getWiiGameRegion(gameId);
            default:
                throw new Error(`Unknown console ${console}`);
        }
    }

    getCoverURL(console, type, region, gameId, extention) {
        return `https://art.gametdb.com/${console}/${type}/${region}/${gameId}.${extention}`;
    }

    

    async downloadCover(console, type, gameId, region) {
        const filepath = path.resolve(
            CACHE.COVER,
            console,
            type,
            region,
            `${gameId}.${this.getExtension(type, console)}`
        )

        if (fs.existsSync(filepath)) {
            return filepath;
        }

        const url = this.getCoverURL(console, type, region, gameId, this.getExtension(type, console));
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download cover for ${gameId}`);
        }

        await saveFile(filepath, await response.body);
        return filepath;
    }

    getExtension(coverType, gameConsole) {
        if (gameConsole !== CONSOLE.WII && coverType === COVER_TYPE.COVER) {
            return 'jpg';
        }
        return 'png';
    }

    async getCover(console, type, gameId, region) {
        switch(console) {
            case CONSOLE.THREEDS:
            case CONSOLE.SWITCH:
                switch(type) {
                    case COVER_TYPE.COVER_3D:
                        type = COVER_TYPE.BOX;
                        break;
                    case COVER_TYPE.DISC:
                        type = COVER_TYPE.CART;
                        break;
                    default:
                        break;
            }
            default:
                break;
        }

        const gameRegion = await this.getGameRegion(console, gameId);

        if (region === gameRegion) {
            try {
                return await this.downloadCover(console, type, gameId, region);
            } catch {
                try {
                    return await this.downloadCover(console, type, gameId, 'EN');
                } catch {
                    return this.downloadCover(console, type, gameId, 'US');
                }
            }
        } else {
            try {
                return await this.downloadCover(console, type, gameId, gameRegion);
            } catch {
                try {
                    return await this.downloadCover(console, type, gameId, this.getGameRegion(console, gameId));
                } catch {
                    try {
                        return await this.downloadCover(console, type, gameId, 'EN');
                    } catch {
                        return this.downloadCover(console, type, gameId, 'US');
                    }
                }
            }
        }
    }

    async getCovers(user) {
        const coverType = user.cover_type;
        const playlog = await prisma.playlog.findMany({
            where: {
                user: {
                    id: user.id
                },
            },
            select: {
                game: {
                    select: {
                        game_id: true,
                        console: true,
                    }
                },
            },
            orderBy: {
                played_on: 'desc',
            },
            distinct: ['game_pk'],
            take: this.max * 2,
        });

        if (playlog.length > 0) {
            // const coverDownloads = playlog.map((logEntry) => {
            //     this.getCover(
            //         logEntry.game.console,
            //         coverType,
            //         logEntry.game.game_id,
            //         user.cover_region
            //     )
            // })

            // const coverPaths = await Promise.allSettled(coverDownloads).then((results) => {
            //     results
            //         .filter((result) => result.status === 'fulfilled')
            //         .map((result: any) => result.value)
            //         .reverse()
            //         .slice(-this.max);
            // });

            const coverPaths = [];

            for (const logEntry of playlog) {
                const coverPath = await this.getCover(
                    logEntry.game.console,
                    coverType,
                    logEntry.game.game_id,
                    user.cover_region
                );
                if (coverPath) {
                    coverPaths.push(coverPath);
                }
            }

            return coverPaths;
        }
    }

    render(ctx: Canvas.CanvasRenderingContext2D, user) {
        var covCurrentX = this.x;
        var covCurrentY = this.y;

        this.getCovers(user).then((coverPaths) => {
            coverPaths.reduce((promise, coverPath) => {
                var inc = 0;

                promise.then(() => {
                    const coverPathSegments = coverPath.split(path.sep);
                    const coverType = coverPathSegments[coverPathSegments.length - 4];

                    if (coverType === CONSOLE.THREEDS) {
                        if (coverType === COVER_TYPE.COVER_3D) {
                          inc = 15;
                        } else if (coverType === COVER_TYPE.COVER) {
                          inc = 80;
                        }
                      }
                
                      if (coverType === CONSOLE.THREEDS && coverType === COVER_TYPE.DISC) {
                        Canvas.loadImage(coverPath).then((image) => {
                            ctx.drawImage(
                                image,
                                covCurrentX,
                                covCurrentY + inc,
                                160,
                                160
                              )
                        });
                      } else if (coverType === CONSOLE.SWITCH && coverType === COVER_TYPE.COVER_3D) {
                        Canvas.loadImage(coverPath).then((image) => {
                            ctx.drawImage(
                                image,
                                covCurrentX,
                                covCurrentY + inc,
                                142,
                                230
                              )
                        });
                      } else if (coverType === CONSOLE.SWITCH && coverType === COVER_TYPE.DISC) {
                        Canvas.loadImage(coverPath).then((image) => {
                            ctx.drawImage(
                                image,
                                covCurrentX,
                                covCurrentY + inc,
                                107,
                                160
                              )
                        });
                      } else {
                        Canvas.loadImage(coverPath).then((image) => {
                            ctx.drawImage(
                                image,
                                covCurrentX,
                                covCurrentY + inc
                              )
                        });
                      }
                
                      covCurrentX += this.increment_x;
                      covCurrentY += this.increment_y;
                    }, Promise.resolve());
                  }
                );
            });
            this.events.emit('rendered');
        };
    }
