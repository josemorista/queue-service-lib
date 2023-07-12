import { PublishToQueueInput, PublishToTopicInput, QueuePublisher } from '../../../entities/QueuePublisher';
import { RabbitMqQueueService } from './RabbitMqQueueService';

export class RabbitMqQueuePublisher implements QueuePublisher {
  private rabbit: RabbitMqQueueService;

  constructor(rabbitConfig: ConstructorParameters<typeof RabbitMqQueueService>[0]) {
    this.rabbit = new RabbitMqQueueService(rabbitConfig);
  }

  private parseMessage(message: unknown) {
    const stringifiedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    return Buffer.from(stringifiedMessage);
  }

  async publishToQueue({ queue, message }: PublishToQueueInput): Promise<void> {
    const channel = await this.rabbit.getChannel();
    channel.sendToQueue(queue, this.parseMessage(message));
  }

  async publishToTopic({ topic, routingKey, message }: PublishToTopicInput): Promise<void> {
    const channel = await this.rabbit.getChannel();
    channel.publish(topic, routingKey || '', this.parseMessage(message));
  }

  async close(): Promise<void> {
    await this.rabbit.disconnect();
  }
}
