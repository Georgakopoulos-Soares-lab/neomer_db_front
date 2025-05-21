import React from "react";

const Privacy = () => (
  <>
    <div id="navbar-container" />

    <section className="py-10 bg-gray-100">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow">
        {/* Main heading */}
        <h1 className="text-4xl font-extrabold text-center mb-4">Privacy Policy</h1>
        {/* Visible license link */}
        <div className="text-center mb-6">
          <a
            href="http://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View NeomerDB CC BY-SA 4.0 License
          </a>
        </div>

        {/* Section content */}
        <p className="ml-6 text-gray-700 mb-4">
          The administrators of NeomerDB provide the following privacy notice to explain what personal data is
          collected, for what purposes, how it is processed and how we keep it secure.
        </p>

        <h3 className="ml-6 font-semibold mb-2">1. Who controls your personal data and how to contact us?</h3>
        <p className="ml-6 text-gray-700 mb-4">
          All data are collected and processed by the administrators of the NeomerDB database.
        </p>

        <h3 className="ml-6 font-semibold mb-2">2. What is the lawful basis for data collection?</h3>
        <p className="ml-6 text-gray-700 mb-4">
          Data are collected to help monitor website functionality, resolve issues, improve the allocated resources
          and provide services to you adequately.
        </p>

        <h3 className="ml-6 font-semibold mb-2">3. What personal data is collected from users?</h3>
        <p className="ml-6 text-gray-700 mb-2">
          The personal data collected by the website’s services are as follows:
        </p>
        <ol className="ml-12 list-decimal list-inside mb-4 text-gray-700">
          <li className="mb-1">IP address</li>
          <li className="mb-1">Date and time of a visit to the service</li>
          <li className="mb-1">Operating System</li>
          <li className="mb-1">Browser</li>
          <li className="mb-1">Amount of data transmitted</li>
        </ol>
        <p className="ml-6 text-gray-700 mb-4">
          The data administrators use the aforementioned data for the following processes:
        </p>
        <ol className="ml-12 list-decimal list-inside mb-4 text-gray-700">
          <li className="mb-1">To provide the user access to the service</li>
          <li className="mb-1">To conduct and monitor data protection activities</li>
          <li className="mb-1">To conduct and monitor website security</li>
          <li className="mb-1">To better understand user needs and guide future improvements</li>
          <li className="mb-1">To communicate with users and answer their questions</li>
        </ol>

        <h3 className="ml-6 font-semibold mb-2">4. Who has access to your personal data?</h3>
        <p className="ml-6 text-gray-700 mb-4">
          Any collected personal data is solely accessed and controlled by the website’s administrators (see question 1).
          No other person has access to the data.
        </p>

        <h3 className="ml-6 font-semibold mb-2">5. Will your personal data be transferred to other organisations?</h3>
        <p className="ml-6 text-gray-700 mb-2">
          Any personal data directly collected by NeomerDB’s services are handled by the administrators of
          NeomerDB exclusively. <strong>There are no transfers to any other organisations whatsoever for these data.</strong>
        </p>
        <p className="ml-6 text-gray-700 mb-4">
          Please note that NeomerDB utilizes a number of third-party resources to provide you with the best
          possible experience. These include <a href="https://jquery.com/">jQuery</a>,{" "}
          <a href="https://fontawesome.com/">FontAwesome</a>,{" "}
          <a href="https://datatables.net/examples/styling/bootstrap5">Bootstrap 5 DataTables</a>, and{" "}
          <a href="https://www.chartjs.org/">Chart.js</a>. Some of these resources store cookies and may record
          data to function. The administrators of NeomerDB are <strong>not</strong> responsible for the treatment
          of any data by these services. Consult their Privacy Policies on their respective websites.
        </p>

        <h3 className="ml-6 font-semibold mb-2">6. How long is your personal data kept?</h3>
        <p className="ml-6 text-gray-700 mb-4">
          Any personal data directly obtained from you will be retained for the minimum amount of time possible to
          ensure legal compliance and to facilitate audits if needed.
        </p>

        <h3 className="ml-6 font-semibold mb-2">7. Cookies Policy</h3>
        <p className="ml-6 text-gray-700 mb-2">
          NeomerDB uses cookies to achieve functionality and provide you with the best possible experience.
          Specifically, we use cookies for the following purposes:
        </p>
        <ol className="ml-12 list-decimal list-inside mb-4 text-gray-700">
          <li className="mb-1">Functionality</li>
          <li className="mb-1">Security</li>
          <li className="mb-1">Cookie consent</li>
        </ol>
        <p className="ml-6 text-gray-700 mb-4">
          Most browsers allow you to refuse or delete cookies. Methods vary by browser and version; see:
        </p>
        <ol className="ml-12 list-decimal list-inside mb-6 text-gray-700">
          <li className="mb-1">
            <a href="https://support.google.com/chrome/answer/95647?hl=en">Google Chrome</a>
          </li>
          <li className="mb-1">
            <a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences">Mozilla Firefox</a>
          </li>
          <li className="mb-1">
            <a href="https://help.opera.com/en/latest/web-preferences/">Opera</a>
          </li>
          <li className="mb-1">
            <a href="https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies">Microsoft IE</a>
          </li>
          <li className="mb-1">
            <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac">Apple Safari</a>
          </li>
          <li className="mb-1">
            <a href="https://privacy.microsoft.com/en-us/windows-10-microsoft-edge-and-privacy">Microsoft Edge</a>
          </li>
        </ol>
        <p className="ml-6 text-gray-700 mb-6">
          Blocking <strong>all</strong> cookies will negatively impact the usability of NeomerDB.
        </p>

        <h3 className="ml-6 font-semibold mb-2">8. Your rights regarding personal data</h3>
        <p className="ml-6 text-gray-700 mb-2">
          You have the right to:
        </p>
        <ol className="ml-12 list-decimal list-inside mb-4 text-gray-700">
          <li className="mb-1">Not be subject to automated decisions without human intervention.</li>
          <li className="mb-1">Request information about your processed personal data.</li>
          <li className="mb-1">Request details on data processing activities applied to you.</li>
          <li className="mb-1">Object to data processing unless we have legitimate reasons.</li>
          <li className="mb-1">Request rectification or erasure if processing violates policies.</li>
        </ol>
        <p className="ml-6 text-gray-700 mb-6">
          Rights 4 and 5 do not apply when processing is necessary to:
        </p>
        <ol className="ml-12 list-decimal list-inside mb-6 text-gray-700">
          <li className="mb-1">Comply with a legal obligation</li>
          <li className="mb-1">Perform a public interest task</li>
          <li className="mb-1">Exercise data controller authority</li>
          <li className="mb-1">Archive for research or statistics</li>
          <li className="mb-1">Establish or defend legal claims</li>
        </ol>
        <p className="ml-6 text-gray-700 mb-8">
          Any requests and objections can be sent to us through the <a href="/about">About</a> page.
        </p>
      </div>
    </section>

    {/* License section */}
    <section id="license" className="py-10">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center mb-4">License</h2>
        <p className="ml-6 text-gray-700 mb-4">
          We have chosen to apply the Creative Commons 4.0 BY-SA license to NeomerDB. More info at{" "}
          <a
            href="http://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            creativecommons.org/licenses/by-sa/4.0
          </a>.
        </p>
        <h3 className="ml-6 font-semibold mb-2">You are free to:</h3>
        <ul className="ml-12 list-disc list-inside mb-4 text-gray-700">
          <li className="mb-1">
            Share — copy and redistribute the material in any medium or format for any purpose, even commercially.
          </li>
          <li className="mb-1">
            Adapt — remix, transform, and build upon the material for any purpose, even commercially.
          </li>
        </ul>
        <h3 className="ml-6 font-semibold mb-2">Under the following terms:</h3>
        <ul className="ml-12 list-disc list-inside mb-4 text-gray-700">
          <li className="mb-1">
            <strong>Attribution</strong> — You must give appropriate credit, provide a link to the license, and
            indicate if changes were made.
          </li>
          <li className="mb-1">
            <strong>ShareAlike</strong> — If you remix, transform, or build upon the material, you must distribute
            your contributions under the same license as the original.
          </li>
          <li className="mb-1">
            <strong>No additional restrictions</strong> — You may not apply legal terms or technological measures
            that legally restrict others from doing anything the license permits.
          </li>
        </ul>
        <h3 className="ml-6 font-semibold mb-2">Notices:</h3>
        <p className="ml-6 text-gray-700 mb-6">
          You do not have to comply with the license for elements of the material in the public domain or where
          your use is permitted by an applicable exception or limitation.
        </p>
        <h2 className="text-2xl font-semibold text-center mb-4">Disclaimer</h2>
        <ul className="ml-12 list-disc list-inside text-gray-700">
          <li className="mb-1">
            We make no warranties regarding the correctness of the data, and disclaim liability for damages
            resulting from its use.
          </li>
          <li className="mb-1">
            We cannot provide unrestricted permission regarding the use of the data, as some data may be covered
            by patents or other rights.
          </li>
          <li className="mb-1">
            We provide NeomerDB for research and informational purposes only. It is not intended as a substitute
            for professional medical advice, diagnosis, treatment, or care.
          </li>
        </ul>
      </div>
    </section>

    <div id="footer-container" />
  </>
);

export default Privacy;
