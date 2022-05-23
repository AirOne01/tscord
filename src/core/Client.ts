import { Client as ClientX, DIService } from 'discordx'
import { container, injectable } from 'tsyringe' 
import { importx } from '@discordx/importer'
import { Intents } from 'discord.js'

import { Database } from '@core/Database'
import { Data } from '@entities'
import { NotBot } from '@utils/guards'

import config from '../../config.json'

@injectable()
export class Client {

    private bot: ClientX

    constructor(
        private db: Database
    ) {

        DIService.container = container

        this.bot = new ClientX({
    
            // To only use global commands (use @Guild for specific guild command), comment this line
            botGuilds: process.env.NODE_ENV === 'development' ? [process.env.TEST_GUILD_ID] : undefined,
          
            // Discord intents
            intents: [
              Intents.FLAGS.GUILDS,
              Intents.FLAGS.GUILD_MEMBERS,
              Intents.FLAGS.GUILD_MESSAGES,
              Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
              Intents.FLAGS.GUILD_VOICE_STATES,
            ],
          
            // Debug logs are disabled in silent mode
            silent: config.debugLogs,

            guards: [
                NotBot
            ],
          
            // Configuration for @SimpleCommand
            simpleCommand: {
              prefix: config.simpleCommandsPrefix,
            },
        })
    }

    async start() {

        await importx(__dirname + "/../{events,commands}/**/*.{ts,js}")
        
        await this.initDataTable()

        this.login()
    }

    async login() {

        // Log in with your bot token
        if (!process.env.BOT_TOKEN) throw Error("Could not find BOT_TOKEN in your environment")

        await this.bot.login(process.env.BOT_TOKEN)
    }

    async initDataTable() {

        const initialDatas = {
            maintenance: false,
            lastMaintenance: null,
            lastStartup: Date.now(),
        }

        for (const key of Object.keys(initialDatas)) {

            const dataRepository = this.db.getRepo(Data)

            await dataRepository.add(
                key, 
                initialDatas[key as keyof typeof initialDatas]
            )
        }
    }

    async isInMaintenance(): Promise<boolean> {
            
        const dataRepository = this.db.getRepo(Data)
        const maintenance = await dataRepository.get('maintenance')
        
        return !!maintenance as boolean
    }

    async setMaintenance(maintenance: boolean) {

        const dataRepository = this.db.getRepo(Data)
        await dataRepository.set('maintenance', maintenance)
    }
}