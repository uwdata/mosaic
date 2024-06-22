<main>
    <div class="table-container">
        <div class="left-column">
            <slot name="left"></slot>
        </div>
        <div class="right-column">
            <slot name="right"></slot>
        </div>
    </div>
</main>


<style>
    .table-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 12px;
        width: 400px; /* Fixed width */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .left-column {
        flex: 1;
        padding-right: 6px; /* Adjust padding for spacing */
    }

    .right-column {
        flex: 1;
        padding-left: 6px; /* Adjust padding for spacing */
        text-align: right;
        border-left: 1px solid #ccc; /* Border between left and right */
        padding-left: 6px; /* Add padding to the right column */
    }

    @media (max-width: 768px) {
        .table-container {
            width: 100%; /* Full width on smaller screens */
        }
    }
</style>