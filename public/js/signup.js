alert(typeof window.supabase);

const supabase = window.supabase.createClient(
    "https://ijgefaknhzydvppkiysr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2VmYWtuaHp5ZHZwcGtpeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzUwNDIsImV4cCI6MjA5OTgxMTA0Mn0.GTrUIAhd11BC5bBjwGdlSBBe6d2xV19bn2hged5pc6g"
);

document.getElementById("createBtn").addEventListener("click", async () => {

    alert("Button works!");

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        alert(error.message);
        console.log(error);
        return;
    }

    alert("Supabase signup successful!");
    console.log(data);

});
