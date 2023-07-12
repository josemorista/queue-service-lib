import amqp, { Options, Connection, Channel } from 'amqplib';

interface RabbitMqQueueConsumerProps {
  connection: string | Options.Connect;
}
export class RabbitMqQueueService {
  private connection: Connection | null;
  private channel: Channel | null;

  constructor(readonly rabbitConfig: RabbitMqQueueConsumerProps) {
    this.connection = null;
    this.channel = null;
  }

  async getConnection() {
    if (this.connection) return this.connection;
    this.connection = await amqp.connect(this.rabbitConfig.connection);
    return this.connection;
  }

  async getChannel() {
    if (this.channel) return this.channel;
    this.channel = await (await this.getConnection()).createChannel();
    return this.channel;
  }

  async closeChannel() {
    await (await this.getChannel()).close();
    this.channel = null;
  }

  async closeConnection() {
    await (await this.getConnection()).close();
    this.connection = null;
  }

  async disconnect() {
    await this.closeChannel();
    await this.closeConnection();
  }
}
