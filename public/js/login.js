document.getElementById("devLogin").addEventListener("click", () => {

    const developer = {
        id: "developer",
        username: "Harold",
        cred: 0,
        paper_balance: 10000,
        real_balance: 0,
        referral_code: "HAROLD001"
    };

    localStorage.setItem("user", JSON.stringify(developer));

    window.location.href = "/dashboard.html";

});
