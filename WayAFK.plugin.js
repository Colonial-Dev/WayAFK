/**
* @name WayAFK
* @author SomewhereOutInSpace
* @license MIT
* @description A fix for AFK detection under Wayland display servers.
* @version 1.0.0
*/

const Dispatcher = BdApi.Webpack.getModule(m => m.dispatch && m.subscribe);
const Patcher = BdApi.Patcher;

var WayAFKConfig = {
    timeout: 600
};

module.exports = class WayAFK {
    constructor(meta) {
        this.afk = false;
        this.interval = null;
        this.lastInteraction = new Date();
        this.controller = new AbortController();
    }
    
    start() {
        // Load configuration from disk.
        WayAFKConfig = Object.assign({}, WayAFKConfig, BdApi.loadData("WayAFK", "settings"));
        
        // Specify options (for abort controller) and interaction listener.
        let options = { signal: this.controller.signal };
        let listener = () => this.handleInteraction();
        
        // Subscribe to all keydown/mousedown events with the listener.
        document.addEventListener('keydown', listener, options);
        document.addEventListener('mousedown', listener, options);
        
        // Start an interval that checks if we should go AFK ever 1000ms.
        this.interval = window.setInterval(() => this.checkElapsed(), 1000);
        
        // Patches the dispatcher - if we are AFK and an AFK event is fired,
        // this will unconditionally rewrite it to be true.
        // (The Wayland bug seems to regularly generate false AFK events, so
        // this handles those without having to spam true AFK events.)
        BdApi.Patcher.before("WayAFK", Dispatcher, "dispatch", (that, args) => {
            const [ event ] = args;
            if (event.type === "AFK" && this.afk) {
                event.afk = true;
            }
        });
    }
    
    stop() {
        window.clearInterval(this.interval);
        Patcher.unpatchAll("WayAFK");
        this.controller.abort();
    }
    
    handleInteraction() {
        if (this.afk) {
            console.log("[WayAFK] Exiting AFK...");
            this.afk = false;
        }
    
        this.lastInteraction = new Date();
    }
    
    checkElapsed() {
        let elapsedTime = new Date() - this.lastInteraction;
        elapsedTime /= 1000;
        elapsedTime = Math.round(elapsedTime);
            
        if (elapsedTime >= WayAFKConfig.timeout && !this.afk) {
            console.log("[WayAFK] Spoofing AFK...");
            Dispatcher.dispatch({type: 'AFK', afk: true});
            this.afk = true;
        }
    }
    
    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.id = "WayAFK-settings";

        const timeoutSetting = document.createElement("div");
        timeoutSetting.classList.add("setting");

        const timeoutLabel = document.createElement("span")
        timeoutLabel.textContent = "Timeout (seconds) ";
        timeoutLabel.style = "color:white";

        const timeoutInput = document.createElement("input");
        timeoutInput.type = "number";
        timeoutInput.name = "buttonText";

        timeoutSetting.append(timeoutLabel, timeoutInput);
        
        timeoutInput.value = WayAFKConfig.timeout;
        timeoutInput.addEventListener("change", () => {
            WayAFKConfig.timeout = timeoutInput.value;
            BdApi.saveData("WayAFK", "settings", WayAFKConfig);
        });

        panel.append(timeoutSetting);

        return panel;
    }
};
