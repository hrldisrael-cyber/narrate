alert("signup.js loaded");

const supabase = window.supabase.createClient(
    "https://ijgefaknhzydvppkiysr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2VmYWtuaHp5ZHZwcGtpeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzUwNDIsImV4cCI6MjA5OTgxMTA0Mn0.GTrUIAhd11BC5bBjwGdlSBBe6d2xV19bn2hged5pc6g"
);

alert("Supabase client created");

document.getElementById("createBtn").addEventListener("click", async () => {

    alert("Button clicked");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    alert("Email: " + email);

    try {

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            alert("Supabase Error: " + error.message);
            console.error(error);
            return;
        }

        alert("Signup successful!");
        console.log(data);

    } catch (err) {
        alert("JavaScript Error: " + err.message);
        console.error(err);
    }

});
