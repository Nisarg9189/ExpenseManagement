const socket = io();

    socket.on("connect", () => {
      socket.emit("joinRoom", { userId: userId });
    });

    socket.on("approvedExpense", (data) => {
      // Find the row with matching data-id
      let tr = document.querySelector(`tr[data-id="${data._id}"]`);
      console.log(tr);
      if (!tr) return; // safety check

      // Find the badge inside that row
      let status = tr.querySelector(".badge");

      // Update the badge
      status.className = "badge badge-approved";
      status.textContent = "APPROVED";

      // Decrease pending count and update display
      pending -= 1;
      if (pending < 0) pending = 0;
      document.getElementById("userPendingCount").textContent = pending;

      let amt = tr.querySelector("#amt").textContent.trim().replace(/[^\d.]/g, "");
      let amount = parseInt(amt);

      approvedSum += amount;
      document.getElementById("UserApprovedSum").textContent = "Total: " + "₹" + approvedSum;

      approvedCount += 1;
      document.getElementById("userApprovedCount").textContent = approvedCount;
    });

    socket.on("rejectedExpense", (data) => {
      // Find the row with matching data-id
      let tr = document.querySelector(`tr[data-id="${data._id}"]`);
      console.log(tr);
      if (!tr) return; // safety check

      // Find the badge inside that row
      let status = tr.querySelector(".badge");

      // Update the badge
      status.className = "badge badge-rejected";
      status.textContent = "REJECTED";

      // Decrease pending count and update display
      pending -= 1;
      if (pending < 0) pending = 0;
      document.getElementById("userPendingCount").textContent = pending;

      let amt = tr.querySelector("#amt").textContent.trim().replace(/[^\d.]/g, "");
      let amount = parseInt(amt);

      rejectedSum += amount;
      document.getElementById("UserRejectedSum").textContent = "Total: " + "₹" + rejectedSum;

      rejectedCount += 1;
      document.getElementById("userRejectedCount").textContent = rejectedCount;
    });

    function openModal(modalId) {
      document.body.style.overflow = "hidden";
      document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
      document.body.style.overflow = "auto";
      document.getElementById(modalId).classList.remove('active');
    }

    function viewExpense(expenseId) {
      alert('View expense details for: ' + expenseId);
    }

    // Close modal on outside click
    window.onclick = function (event) {
      if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
      }
    }