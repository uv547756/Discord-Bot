const { Client, GatewayIntentBits, PermissionsBitField, Permissions } = require('discord.js');
const SpotifyWebApi = require('spotify-web-api-node');
const ytdl = require('ytdl-core'); // Library to stream YouTube videos 
const playdl = require('play-dl'); // Library to search for YouTube videos (doesn't work without ytdl-core)
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const { token, clientId, clientSecret, redirectUri } = require('./config.json');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

const spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectUri
});

// Function to get Spotify access token
const getSpotifyAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Spotify access token retrieved successfully');
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
  }
};

// Refresh Spotify token every 55 minutes
setInterval(getSpotifyAccessToken, 55 * 60 * 1000);

client.once('ready', () => {
  console.log('Bot is online!');
  getSpotifyAccessToken();
});

// Commands dictionary
const commands = {
  '!play <song>': 'Plays a song from Spotify by searching for it on YouTube',
  '!stop': 'Stops the current playback and disconnects the bot from the voice channel',
  '!help': 'Lists all available commands'
};

// Play music command
const playMusicas = async (message, query) => {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

  try {
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return message.reply('I need permissions to join and speak in your voice channel!');
    }

    // Search for the track on Spotify
    const response = await spotifyApi.searchTracks(query);
    const track = response.body.tracks.items[0];
    if (!track) return message.reply('No results found on Spotify.');
//
    console.log('Spotify track found:', track.name);

    // Search for the track on YouTube
    const video = await ytdl.getInfo(`${track.name} ${track.artists[0].name}`);
    if (!video) return message.reply('No results found on YouTube.');

    console.log('YouTube video found:', video.videoDetails.video_url);

    // Function to play the audio stream
    const playStream = async (connection, videoUrl) => {
      const stream = ytdl(videoUrl, { filter: 'audioonly' });
      const resource = createAudioResource(stream, { inputType: 'webm/opus' });
      const player = createAudioPlayer();

      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log('The audio player has started playing!');
      });

      player.on(AudioPlayerStatus.Buffering, () => {
        console.log('Audio player is buffering...');
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Playback ended, destroying connection.');
        connection.destroy();
      });

      player.on('error', (error) => {
        console.error('Error playing track:', error.message);
        connection.destroy();
        message.reply('An error occurred while playing the track. Retrying...');
        setTimeout(() => playMusic(message, query), 5000); // Retry after 5 seconds
      });

      connection.subscribe(player);
    };

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      console.log('Disconnected from voice channel, stopping player.');
    });

    playStream(connection, video.videoDetails.video_url);
    
    message.reply(`Now playing: ${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`);
  } catch (error) {
    console.error('Error playing track:', error);
    message.reply('There was an error playing the track.');
  }
};

const playMusic = async (message, query) => {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

  try {
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(Permissions.FLAGS.CONNECT) || !permissions.has(Permissions.FLAGS.SPEAK)) {
      return message.reply('I need permissions to join and speak in your voice channel!');
    }

    // Search for the track on Spotify
    const response = await spotifyApi.searchTracks(query);
    const track = response.body.tracks.items[0];
    if (!track) return message.reply('No results found on Spotify.');

    console.log('Spotify track found:', track.name);

    // Search for the track on YouTube using play-dl
    const searchQuery = `${track.name} ${track.artists[0].name} official audio`; // Adjust search query if needed
    console.log('Searching YouTube with query:', searchQuery);

    const video = await playdl.search(searchQuery, { limit: 1 });
    if (!video[0] || !video[0].url) {
      throw new Error('No valid video found');
    }

    console.log('YouTube video found:', video[0].url);

    // Play the audio stream
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    player.on(AudioPlayerStatus.Playing, () => {
      console.log('The audio player has started playing!');
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Playback ended, destroying connection.');
      connection.destroy();
    });

    player.on('error', (error) => {
      console.error('Error playing track:', error);
      connection.destroy();
      message.reply('An error occurred while playing the track. Retrying...');
      setTimeout(() => playMusic(message, query), 5000); // Retry after 5 seconds
    });

    const resource = createAudioResource(video[0].url, { inputType: 'webm/opus' });
    player.play(resource);
    connection.subscribe(player);
    
    message.reply(`Now playing: ${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`);
  } catch (error) {
    console.error('Error playing track:', error);
    message.reply('There was an error playing the track.');
  }
};
// Stop music command
const stopMusic = (message) => {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('You need to be in a voice channel to stop the music!');

  const connection = getVoiceConnection(voiceChannel.guild.id);
  if (connection) {
    connection.destroy();
    message.reply('Music stopped and bot disconnected from the voice channel.');
  } else {
    message.reply('Bot is not connected to a voice channel.');
  }
};

const playTestFile = async (message) => {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

  try {
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return message.reply('I need permissions to join and speak in your voice channel!');
    }

    const player = createAudioPlayer();
    const resource = createAudioResource('C://Users/PC/Downloads/Music/sample.mp3');

    player.play(resource);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
      console.log('The audio player has started playing!');
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Playback ended, destroying connection.');
      connection.destroy();
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      console.log('Disconnected from voice channel, stopping player.');
      player.stop();
    });

    player.on('error', (error) => {
      console.error('Error playing test file:', error);
      message.reply('There was an error playing the test file.');
    });

    message.reply('Playing test file.');
  } catch (error) {
    console.error('Error playing test file:', error);
    message.reply('There was an error playing the test file.');
  }
};


// Help command
const displayHelp = (message) => {
  let helpMessage = 'Available commands:\n';
  for (const [command, description] of Object.entries(commands)) {
    helpMessage += `\`${command}\`: ${description}\n`;
  }
  message.reply(helpMessage);
};

client.on('messageCreate', (message) => {
  if (message.content.startsWith('!play ')) {
    const query = message.content.split('!play ')[1];
    playMusic(message, query);
  } else if (message.content === '!stop') {
    stopMusic(message);
  } else if (message.content === '!help') {
    displayHelp(message);
  } else if (message.content === '!test') {
    playTestFile(message);
  }
});

client.login(token);