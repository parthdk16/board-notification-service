const amqp = require('amqplib');

async function publish() {
  try {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();

    const exchange = 'notification_exchange';
    const pattern = 'result_published';

    const payload = {
      pattern: 'result_published',
      data: {
        studentId: 'STD2024001',
        resultData: {
          examName: 'Higher Secondary Examination Feb 2025',
          score: 85,
          grade: 'A+',
          maxScore: 100,
          status: 'Pass',
          date: '2025-07-17'
        },
      },
    }

    await channel.assertExchange(exchange, 'direct', { durable: true });

    // Send message to the exchange with the pattern
    channel.publish(exchange, pattern, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      persistent: false,
    });

    console.log(`Message sent to pattern: ${pattern}`);
    console.log(`Payload: ${JSON.stringify(payload)}`);

    setTimeout(() => {
      conn.close();
    }, 1000);
  } catch (error) {
    console.error('Error publishing message:', error);
  }
}

publish().catch(console.error);
