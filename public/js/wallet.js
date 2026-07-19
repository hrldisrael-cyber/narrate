const supabase = window.supabase.createClient(
    "https://ijgefaknhzydvppkiysr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2VmYWtuaHp5ZHZwcGtpeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzUwNDIsImV4cCI6MjA5OTgxMTA0Mn0.GTrUIAhd11BC5bBjwGdlSBBe6d2xV19bn2hged5pc6g"
);

const button = document.getElementById("walletBtn");

button.addEventListener("click", async () => {

    if (!window.solana) {
        alert("No Solana wallet found.\n\nPlease install Phantom or another Solana wallet.");
        return;
    }

    try {

        await window.solana.connect();

        const { data, error } = await supabase.auth.signInWithWeb3({
            chain: "solana",
            statement: "Sign in to Narrate"
        });

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        console.log(data);

        alert("Wallet connected successfully!");

        window.location.href = "/dashboard.html";

    } catch (err) {
        console.error(err);
        alert(err.message);
    }

});
