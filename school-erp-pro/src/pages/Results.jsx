export default function Results() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 विद्यार्थी निकाल</h2>

      <p>ही नमुना निकाल यादी आहे. निकाल नोंदवणे आणि QR सुविधा या React आवृत्तीत अद्याप जोडलेल्या नाहीत.</p>

      <button disabled title="या आवृत्तीत निकाल नोंदवण्याची सुविधा उपलब्ध नाही">➕ नवीन निकाल</button>

      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>GR No.</th>
            <th>विद्यार्थी</th>
            <th>इयत्ता</th>
            <th>टक्केवारी</th>
            <th>QR</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>101</td>
            <td>Demo Student</td>
            <td>10</td>
            <td>90%</td>
            <td>QR</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
