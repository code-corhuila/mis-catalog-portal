export default `
:host{display:block;color:#172a3b;font-family:Arial,sans-serif;letter-spacing:0}*{box-sizing:border-box}
h1{font-size:24px;margin:0}h2{font-size:19px;margin:0;overflow-wrap:anywhere}.eyebrow{font-size:11px;color:#0d655b;font-weight:700;margin:0 0 7px}
.heading{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;border-bottom:1px solid #dbe3ee;padding-bottom:20px;margin-bottom:24px}
button{min-height:40px;padding:8px 14px;border:1px solid #c5d1de;border-radius:6px;background:white;color:#243c45;cursor:pointer;font:inherit;font-size:14px;flex-shrink:0;white-space:normal}
button:disabled{opacity:.5;cursor:default}button:hover:not(:disabled){background:#edf3fa}:focus-visible{outline:3px solid #187dca;outline-offset:2px}
.heading>.actions button:last-child,.form-actions button[type=submit]{background:#2563eb;border-color:#2563eb;color:white}
.heading>.actions button:last-child:hover:not(:disabled),.form-actions button[type=submit]:hover:not(:disabled){background:#1d4ed8}
button.danger{color:#b42335;border-color:#e7b7bf;background:#fff6f7}button.danger:hover:not(:disabled){background:#fee2e2}
label{display:block;font-size:13px;font-weight:600;margin-bottom:8px}
input{height:44px;max-width:440px;width:100%;min-width:0;padding:10px 12px;border:1px solid #a7b9ca;border-radius:6px;font:inherit;font-size:14px;background:white;color:inherit}
input:disabled{background:#edf1f5;color:#637486}.summary,small,dt{color:#637486}.summary{font-size:13px;margin:20px 0 12px}
.table-scroll{overflow:auto;background:white;border:1px solid #dbe3ee;border-radius:6px}
table{width:100%;min-width:760px;table-layout:fixed;border-collapse:collapse;text-align:left;font-size:13px}
th{font-weight:600;background:#edf2f8;color:#3d4e68}th:nth-child(1){width:22%}th:nth-child(2){width:28%}th:nth-child(3){width:24%}th:nth-child(4){width:12%}th:nth-child(5){width:14%}
th,td{padding:13px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top;overflow-wrap:anywhere}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#f8fafc}
small{display:block;margin-top:5px;line-height:1.5}td span{display:inline-block;color:#15803d;background:#dcfce7;padding:4px 8px;border-radius:4px;font-size:12px}td span.inactive{color:#b42335;background:#fee2e2}
.pagination{display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:12px;margin:18px 0;font-size:13px}
.detail,.creation{border-top:1px solid #dbe3ee;padding-top:24px;margin-top:24px}.detail .heading{margin-bottom:16px}.creation{border-bottom:1px solid #dbe3ee;padding-bottom:24px;margin-bottom:24px}
dt{font-size:12px;margin-top:14px}dd{margin:5px 0;overflow-wrap:anywhere;font-size:14px;line-height:1.5}[role=alert]{color:#b42335;line-height:1.5}[role=alert]:empty{display:none}
.actions{display:flex;gap:12px;flex-wrap:wrap}.creation-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:20px}.creation-form input{max-width:none}.form-actions{grid-column:1/-1;justify-content:flex-end}
.success{color:#15803d}.record-id{overflow-wrap:anywhere;font-size:13px}.row-actions{display:grid;gap:8px}
@media(max-width:800px){.creation-form{grid-template-columns:minmax(0,1fr)}.form-actions{flex-direction:column}.actions button{max-width:100%}.pagination{justify-content:space-between;gap:8px}.pagination span{font-size:12px}.pagination button{padding:8px 10px}}
`;
