# Academy 1.1 · Knowledge Library

Open the local Arena and choose **Academy**. Gold and Cryptocurrency show your completed lessons and open the existing journeys. Cryptocurrency uses Bitcoin as its first instrument and retains the original Bitcoin route and progress identifiers. The Stocks & ETFs card shows the status of its future curriculum.

## Manage educational resources

1. Open **Learning Lounge → Add educational video**.
2. Paste an HTTPS link to a YouTube video you’ve reviewed. Enter its actual title and educator. Pick a category, market and difficulty. Add a duration, description, related lesson or practice drill when applicable.
3. Select **Save resource** and open the new card. Use **Play embedded video** to request playback or **Open on YouTube** to go directly to the source. **Load thumbnail** requests the thumbnail from YouTube.
4. In the opened card, select **Edit resource** to update the details. **Remove resource → Confirm removal** archives the entry from the visible catalog. Use **Save to study library**, **Mark watched**, and **Add a personal study note** to organize your study.

The catalog starts empty. No educator links or videos are bundled. YouTube link validation checks the protocol, host and video ID. Playability depends on the uploader, the provider and the browser. Arena does not certify the accuracy of user-added descriptions.

## Study and reflect

- **Market Archives** provides five cited historical case studies. Each includes a study exercise, personal notes, related videos from matching categories, and a place for a future replay association.
- **Market Knowledge** provides twelve expandable concepts with practical context and links to matching videos. Selected topics link to official references.
- **The Disciplined Trader** includes eight GxB reflections. Use the previous and next controls, save favorites, or add a personal reflection. The model has a future audio slot for original material.
- **My Study Library** brings together bookmarks, notes, favorite reflections, saved videos and recent views for the active profile.

Your study data is included in **Settings → Export backup** and in backup restore. Each profile has its own catalog and personal study activity. Guest study lasts for the tab session. Existing Gold and Bitcoin activity continues to use the existing training store.

## Local verification

```powershell
node tools/test-home.cjs
node --test tools/test-arena-store.mjs tools/test-learning.mjs tools/test-study.mjs
node tools/test-study-browser.cjs
```

The browser test requires Playwright and Edge or Chromium. See [Release 1 verification](ARENA-RELEASE-1.md) for environment variables. Set `ACADEMY_STUDY_SCREENSHOTS` to save the landing and individual journey screenshots.

The Cryptocurrency card uses a locally bundled ImageGen image of a bronze Bitcoin token against dark navy slate. Gold reuses the Command Center bullion image. The structured Stocks & ETFs curriculum, streaming, original audio, and historical replay associations remain future work.
