# Uploading to YouTube

Files:

- **Video:** `output/food-is-yummy-youtube.mp4` (made with `npm run render:youtube`: 1080p30, H.264 at YouTube's recommended 8 Mb/s, AAC 384 kb/s)
  - The regular `output/food-is-yummy.mp4` (1080p30, about 7 Mb/s) also uploads fine if you'd rather not re-render.
- **Thumbnail:** `youtube/thumbnail.jpg` (1280×720)
- **Captions:** `youtube/captions.en.srt` (the lyrics, timed to the song)

## Steps

1. Go to [studio.youtube.com](https://studio.youtube.com) and choose **Create → Upload videos**, then pick the video file.
2. Paste the title and description below.
3. Under **Thumbnail**, choose **Upload file** and pick `thumbnail.jpg`. Custom thumbnails need a phone-verified channel.
4. Answer the **Audience** question. YouTube requires it for every video. It's a cartoon of a kids' song, so "Yes, it's made for kids" is probably the accurate answer. That setting turns off comments and personalised ads.
5. Under **Show more → Tags**, paste the tags.
6. On the **Video elements** page, choose **Add subtitles → Upload file → With timing** and pick `captions.en.srt`.
7. On the **Visibility** page, choose **Unlisted** to share only by link, or **Public** for anyone.

## Title

```
Food Is Yummy | Animated Music Video
```

## Description

```
Two cats sing about dinner. And about that old thing at the back of the cupboard.

A tuxedo cat and a ginger cat drum on saucepans, open a very old tin, dance in a fountain of food, break the glasses with a yodel, and finally flop onto their favourite chair and fall asleep.

Lyrics
Bum!
Food is yummy, bum ba ba bum
It tastes good like that old thing in the cupboard
Dun da-da dun, da-da dun
I eat every day, a-a-a a-a-a aaay!
A-a-AY, ay!
Yum in my tum, hip hip hooray!

Music made with Suno. Animation drawn frame by frame with code.
```

## Tags

```
Food Is Yummy, cats, singing cats, kids song, animated music video, cartoon, funny song, tuxedo cat, ginger cat, family
```
