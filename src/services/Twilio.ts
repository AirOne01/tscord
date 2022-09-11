import { singleton } from 'tsyringe'
import { Twilio as TwilioSDK } from 'twilio'

import { twilioConfig, twilioPhoneNumbers } from "@config"


@singleton()
export class Twilio {
    public client: TwilioSDK;

    constructor() {
        if(twilioConfig.enabled) this.client = new TwilioSDK(
            process.env["TWILIO_ACCOUNT_SID"] as string,
            process.env["TWILIO_AUTH_TOKEN"]  as string,
            { logLevel: twilioConfig.debug ? "debug" : undefined }
        )
    }

    public async sendSMS(from: typeof twilioPhoneNumbers[number], to: string, body: string) {
        if(!twilioConfig.enabled || !this.client) return;
        if(!twilioPhoneNumbers.includes(from)) throw new Error(`Invalid source phone number: ${from}`);
        
        return this.client.messages.create({ from, to, body });
    }
}