const Discord = require('discord.js');
const { IgApiClient } = require('instagram-private-api');

const client = new Discord.Client();
const igClient = new IgApiClient();

const config = require('./config.json')

const users = [];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (message.content === '!addme') { // When doing this command, The bot will notifies you when the user or you posted a new post in ig
    if (!users.includes(message.author.id)) {
      users.push(message.author.id);
      await message.reply('You have been added to the notification list!');
    } else {
      await message.reply('You are already in the notification list!');
    }
  }
});

async function getLatestPost() {
  const user = await igClient.user.usernameinfo('itz.avekiell');
  const feed = igClient.feed.user(user.pk);
  const posts = await feed.items();
  return posts[0];
}

async function notifyUsers(post) {
  const embed = new Discord.MessageEmbed()
    .setAuthor(post.user.username)
    .setDescription(post.caption.text)
    .setImage(post.image_versions2.candidates[0].url)
    .setColor('#405DE6')
    .setTimestamp();

  users.forEach(async userId => {
    try {
      const user = await client.users.fetch(userId);
      await user.send(embed);
    } catch (error) {
      console.error(error);
    }
  });
}

async function startPolling() {
  await igClient.state.generateDevice(config.handlename);
  await igClient.account.login(config.igusername, config.igpassword);

  let latestPost = await getLatestPost();
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 60000));
    const post = await getLatestPost();
    if (post.id !== latestPost.id) {
      latestPost = post;
      await notifyUsers(post);
    }
  }
}

client.login(config.token)
  .then(() => startPolling())
  .catch(console.error);
