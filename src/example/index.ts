import setupApp from "./app";

// setup and start the app
setupApp()
  .then(app => {
    const port = 3000;

    app.listen(port, () => {
      console.log("server started on port 3000");
    });
  })
  .catch(e => console.error(e));
