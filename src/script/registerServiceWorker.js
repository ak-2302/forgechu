if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration =
                await navigator.serviceWorker.register("../serviceWorker.js");

            console.log(
                "Service Worker registered",
                registration
            );
        } catch (error) {
            console.error(
                "Service Worker registration failed",
                error
            );
        }
    });
}