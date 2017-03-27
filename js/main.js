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

  var adminEmails = ['ukogan@nuxeo.com', 'uri@nuxeo.com', 'ebarroca@nuxeo.com',
    'eb@nuxeo.com', 'anahide@nuxeo.com', 'at@nuxeo.com', 'nsilva@nuxeo.com',
    'ns@nuxeo.com', 'tcardoso@nuxeo.com', 'tc@nuxeo.com', 'bchauvin@nuxeo.com',
    'bch@nuxeo.com', 'ajubert@nuxeo.com', 'anne.jubert@nuxeo.com', 'aj@nuxeo.com',
    'sguitter@nuxeo.com', 'sg@nuxeo.com', 'mlumeau@nuxeo.com', 'ml@nuxeo.com',
    'lkemen@nuxeo.com', 'lk@nuxeo.com', 'ktouchie@nuxeo.com', 'kt@nuxeo.com',
    'aescaffre@nuxeo.com', 'ae@nuxeo.com', 'tdelprat@nuxeo.com', 'td@nuxeo.com'];

  // Sign in
  function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
  }

  // Sign out
  function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
    location.reload();
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

      // Display link to Google Sheets if Admin
      var userEmail = gapi.auth2.getAuthInstance().currentUser.get().w3.U3;
      var userIsAdmin = ($.inArray(userEmail, adminEmails) > -1);
      var $gsheetsButton = $('#content > #jumbo > .container-fluid > button#sheets-link');
      var gsheetsLink = 'https://docs.google.com/spreadsheets/d/15lv3YL0WFkDB2DHYaIaOQN66HWrm21v7mP_-H9pkKEA/edit#gid=0';
      if (userIsAdmin) {
        $gsheetsButton.show();
        $gsheetsButton.click(function() {
          window.open(gsheetsLink);
        });
      } else {
        $gsheetsButton.hide();
      }

      authorizeButton.style.display = 'none';
      signoutButton.style.display = 'block';
      display();
    } else {
      authorizeButton.style.display = 'block';
      signoutButton.style.display = 'none';
    }
  }

// Get TD selector from column heading
  function getSelectorFromHeading(heading) {
    var columnId = '#' + heading;
    var columnClassStr = $(columnId).index();
    return columnClass = '.column' + columnClassStr;
  }

// Hide columns given id
  function hideColumn(columnIdStr) {
    $(getSelectorFromHeading(columnIdStr)).hide();
  }

// Hide select2 boxes given id
  function hideSelect2Box(columnIdStr) {
    var columnId = '#' + columnIdStr;
    var selectId = $(columnId).index();
    var selector = 'select#sel' + selectId;
    $(selector).removeClass('basic-multiple');
    $(selector).hide();
  }

// Get unique values of array
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

// Get unique values in column
  function getUniqueValues(columnIndex) {
    var selector = 'td.column' + columnIndex;
    var values = [];
    $(selector).each(function() {
      if (columnIndex == $('#epic').index()) {
        values.push($(this).text().replace(/https:\/\/jira.nuxeo.com\/browse\//, ''));
      } else {
        values.push($(this).text());
      }
    });
    return values.filter(onlyUnique);
  }

// Display filters according to team
  function teamFilters(team) {
    // Hide "useless" select2 boxes
    hideSelect2Box('roadmap_item');
    hideSelect2Box('scope');
    hideSelect2Box('workload');
    hideSelect2Box('specification_link');
    hideSelect2Box('origin');

    switch(team) {
      case 'presales':
        hideSelect2Box('estimate_status');
        hideSelect2Box('specification_status');
        break;

      case 'dev':
        hideSelect2Box('business_target');
        hideSelect2Box('business_goal');
        break;

      default:
        break;
    }
  }

// Add options to select2 menus
  function getOptions() {
    $('th').each(function() {
      var index = $(this).index();
      var uniqueValues = getUniqueValues(index);
      var selector = 'select#sel' + index;
      for (var i=0; i<uniqueValues.length; i++) {
        var value = uniqueValues[i].toLowerCase().replace(/ /g,"_");
        $(selector).append('<option value="' + value + '">' + uniqueValues[i] + '</option');
      }
      teamFilters('dev');
      $('.basic-multiple').select2();
      $(selector).on('change', function (event) {
        filterBySelection();
      })
    });
  }


  function filterBySelection() {
    $('tr').show();
    $('select').each(function() {
      if ($(this).hasClass('basic-multiple')) {
        var index = $(this).parent().index();
        $('.basic-multiple').each(function() {
          var data = ($(this).select2('data'));
          if (data.length > 0) {
            $('td.column' + $(this).parent().index() + ':visible').each(function() {
              $(this).parent().hide();
              for (var i=0; i<data.length; i++) {
                if ($(this).text().indexOf(data[i].text) > -1) {
                  $(this).parent().show();
                }
              }
            });

          }
        })
      }
    })
  }

// Transform Epic links
  function styleEpicLinks() {
    var selector = 'td' + getSelectorFromHeading('epic');
    $(selector).each(function() {
      var link = $(this).html();
      var text = link.replace(/https:\/\/jira.nuxeo.com\/browse\//, '');
      if (text.length>0) {
        $(this).html('<img src="css/img/epic.png" /><a href="' + link + '">&nbsp;' + text + '</a>');
      }
    })
  }

// Construct table
  function display() {

    // Clear error messages
    $('#error').empty();

    // Run API
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '15lv3YL0WFkDB2DHYaIaOQN66HWrm21v7mP_-H9pkKEA',
      range: 'Roadmap Items!A2:P149',
    }).then(function(response) {

      // Construct table
      var range = response.result;
      if (range.values.length > 0) {
        $('#content').append('<table id="roadmapItems" class="table table-hover"><thead><tr>');
        var row = range.values[0];
        for (var i = 0; i < row.length; i++) {
          var id = row[i].toLowerCase().replace(/ /g,"_");
          $('thead tr').append('<th id="' + id + '" class="align-text-top column' + i + '">'+ row[i] + '<br /><select id="sel' + i
            + '" class="basic-multiple" multiple="multiple"></select></th>');
        }
        $('table').append('<tbody>');
        for (var i = 1; i < range.values.length; i++) {
          var row = range.values[i];
          $('tbody').append('<tr id="row' + i + '">');
          for (var j = 0; j < row.length; j++) {
            $('#row' + i).append('<td class="column' + j + '">' + row[j] + '</td>');
          }
        }
        // Add select2 options
        getOptions();

        // Hide "useless" columns
        hideColumn('total');
        hideColumn('2875');

        // Style epic links
        styleEpicLinks();

      } else {
        $('#error').append('No data found.');
      }
    }, function(response) {
      $('#error').append('Error: ' + response.result.error.message);
    });
  }

  handleClientLoad();

});