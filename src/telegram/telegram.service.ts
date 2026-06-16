import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";

@Injectable()
export class TelegramService implements OnModuleInit {
  private client: TelegramClient;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const apiId = Number(this.configService.get("TELEGRAM_API_ID"));
    const apiHash = this.configService.get<string>("TELEGRAM_API_HASH");
    const sessionString = this.configService.get<string>("TELEGRAM_STRING_SESSION");

    this.client = new TelegramClient(
      new StringSession(sessionString),
      apiId,
      apiHash!,
      { connectionRetries: 5 }
    );

    await this.client.connect();
    this.logger.log("Telegram userbot ulandi ✅");

    this.listenForMessages();
  }

  private listenForMessages() {
    this.client.addEventHandler(
      async (event: NewMessageEvent) => {
        const message = event.message;

        if (!message.isPrivate) return;
        if (message.out) return;

        const sender = await message.getSender() as any;

        const isContact = sender?.contact === true;
        const firstName = sender?.firstName as string | undefined;

        let reply: string;

        if (isContact && firstName) {
          reply = `Assalomu alaykum, ${firstName}! 👋 Men Bunyodbekning yordamchi botiman. Hozir u band, lekin xabaringiz yetib bordi — online bo'lishlari bilan albatta javob qaytaradilar 🙂`;
        } else {
          reply = `Assalomu alaykum! 👋 Men Bunyodbekning yordamchi botiman. Hozir u band bo'lishi mumkin. Ismingizni va xabaringizni yozib qoldirsangiz, ko'rishlari bilan javob beradilar 🙂`;
        }

        this.logger.log(`Xabar: ${firstName ?? "Noma'lum"} — "${message.text}"`);

        await this.sleep(1000 + Math.random() * 1000);

        await message.reply({ message: reply });
        this.logger.log(`Javob yuborildi ✅`);
      },
      new NewMessage({ incoming: true })
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}