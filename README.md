# WayAFK

> **Note**: For a better Wayland experience, I now recommend [Vesktop](https://github.com/Vencord/Vesktop). Vesktop fixes not just AFK on Wayland, but also screensharing. It's also just nicer than BD, in my humble opinion.

This is a simple plugin for BetterDiscord that fixes [this](https://support.discord.com/hc/en-us/community/posts/360052371093-Discord-on-Linux-Wayland-has-no-AFK-detection) longstanding bug with AFK detection on Wayland.

Normally, when running the Discord client under Wayland, the AFK detection will *never* fire. ***EVER.*** This means (among other things) that you won't receive mobile notifications while the client is open under Wayland, which is incredibly frustrating.

WayAFK fixes this by implementing its own form of AFK monitoring, then lying to Discord about your status once it's tripped.

- On startup, WayAFK subscribes to the `keydown` and `mousedown` events. Whenever you press a key or use your mouse inside the Discord window, a timer will be reset.
- Once a second, WayAFK checks to see if the time since your last "interaction" has exceeded the (user-configurable) timeout threshold.
  - If it has, WayAFK will send a "user is AFK" event, then start suppressing any events that say otherwise.
  - Once it detects another interaction, this behavior stops until the timeout is tripped again.
