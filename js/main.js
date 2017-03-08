$(document).ready(function() {

  // Client ID and API key from the Developer Console
  var CLIENT_ID = '348337843097-fh935jd2k8akaddp61ino3o4o7j7dl1t.apps.googleusercontent.com';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

  var authorizeButton = document.getElementById('authorize-button');
  var signoutButton = document.getElementById('signout-button');

  // Sign in
  function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
  }

  // Sign out
  function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
  }

  // load auth2 library and API client library
  function handleClientLoad() {
    gapi.load('client:auth2', initClient);
  }

  // Initialize API client library and set up sign-in state
  function initClient() {
    gapi.client.init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
  }

// Update UI when sign-in changes. Runs API when signed in.
  function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      authorizeButton.style.display = 'none';
      signoutButton.style.display = 'block';
        display();
    } else {
      authorizeButton.style.display = 'block';
      signoutButton.style.display = 'none';
    }
  }

// Hide columns given id
  function hideColumn(columnIdStr) {
    var columnId = '#' + columnIdStr;
    var columnClassStr = $(columnId).index();
    var columnClass = '.' + columnClassStr;
    $(columnClass).hide();
  }

// Get unique values of array
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

// Get unique values in column
  function getUniqueValues(columnIndex) {
    var selector = 'td.' + columnIndex;
    var values = [];
    $(selector).each(function() {
      values.push($(this).text());
    });
    var options = values.filter(onlyUnique);
  }

// Construct table
  function display() {

    // Run API
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '15lv3YL0WFkDB2DHYaIaOQN66HWrm21v7mP_-H9pkKEA',
      range: 'Roadmap Items!A2:P149',
    }).then(function(response) {

      // Construct table
      var range = response.result;
      if (range.values.length > 0) {
        $('#content').append('<table id="roadmapItems"><thead><tr>');
        var row = range.values[0];
        for (var i = 0; i < row.length; i++) {
          var id = row[i].toLowerCase().replace(/ /g,"_");
          $('#content').append('<th id="' + id + '" class="' + (i+1) + '">' + '<select id="' + (i+1)
            + '" class="js-example-basic-multiple" multiple="multiple"></select><br />' + row[i] + '</th>');
        }
        $('#content').append('</tr></thead><tbody>');
        for (var i = 1; i < range.values.length; i++) {
          var row = range.values[i];
          $('#content').append('<tr>');
          for (var j = 0; j < row.length; j++) {
            $('#content').append('<td class="' + (j+1) + '">' + row[j] + '</td>');
          }
          $('#content').append('</tr>');
        }
        $('#content').append('</tbody></table>');

        // Hide "useless" columns
        hideColumn('epic');
        hideColumn('topic');
        hideColumn('total');
        hideColumn('2875');

      } else {
        appendContent('No data found.');
      }
    }, function(response) {
      appendContent('Error: ' + response.result.error.message);
    });
  }

  handleClientLoad();

});