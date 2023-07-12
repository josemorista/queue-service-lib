import { ConsumeMessage } from 'amqplib';
import { QueueConsumer } from '../../../entities/QueueConsumer';
import { RabbitMqQueueService } from './RabbitMqQueueService';

export class RabbitMqQueueConsumer<MessageType> extends QueueConsumer<MessageType> {
  private rabbit: RabbitMqQueueService;

  constructor(
    options: ConstructorParameters<typeof QueueConsumer<MessageType>>[0],
    rabbitConfig: ConstructorParameters<typeof RabbitMqQueueService>[0]
  ) {
    super(options);
    this.rabbit = new RabbitMqQueueService(rabbitConfig);
  }

  private parseMessage(message: ConsumeMessage) {
    const content = message.content.toString('utf8');
    try {
      return JSON.parse(content);
    } catch (error) {
      return content;
    }
  }

  async consume(): Promise<void> {
    const channel = await this.rabbit.getChannel();
    await channel.consume(this.queue, async (message) => {
      if (message) {
        try {
          await this.handler(this.parseMessage(message));
          await channel.ack(message);
        } catch (error) {
          if (error instanceof Error) console.error(`[ERROR]:mId=${message.properties.messageId};|${error.message}`);
          if (this.options.requeueOnError) {
            await channel.nack(message);
          }
        }
      }
    });
  }

  async stop() {
    await this.rabbit.disconnect();
  }
}
