onst supabase = window.supabase.createClient(
    "https://ijgefaknhzydvppkiysr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2VmYWtuaHp5ZHZwcGtpeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzUwNDIsImV4cCI6MjA5OTgxMTA0Mn0.GTrUIAhd11BC5bBjwGdlSBBe6d2xV19bn2hged5pc6g"
);

const createBtn = document.getElementById("createBtn");

createBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Enter your email and password.");
        return;
    }

    try {

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        console.log(data);
        alert("Account created successfully!");

    } catch (err) {
        console.error(err);
        alert(err.message);
    }

});
