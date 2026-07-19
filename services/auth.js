const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    "https://ijgefaknhzydvppkiysr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2VmYWtuaHp5ZHZwcGtpeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzUwNDIsImV4cCI6MjA5OTgxMTA0Mn0.GTrUIAhd11BC5bBjwGdlSBBe6d2xV19bn2hged5pc6g"
);

module.exports = supabase;
