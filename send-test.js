const { startBaileys } =
  require("./services/baileysService");

(async () => {

  await startBaileys();

  setTimeout(async () => {

    await global.baileysSock.sendMessage(
      "918978238484@s.whatsapp.net",
      {
        text:
          "Hello from Baileys 🚀"
      }
    );

    console.log(
      "MESSAGE SENT"
    );

  }, 10000);

})();