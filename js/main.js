$(document).ready(function() {

  // Client ID and API key from the Developer Console
  var CLIENT_ID =
    '348337843097-fh935jd2k8akaddp61ino3o4o7j7dl1t.apps.googleusercontent.com';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4"
  ];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

  var authorizeButton = document.getElementById('authorize-button');
  var signoutButton = document.getElementById('signout-button');
  var configButton = document.getElementById('configure');

  var adminEmails = ['ukogan@nuxeo.com', 'uri@nuxeo.com',
    'ebarroca@nuxeo.com',
    'eb@nuxeo.com', 'anahide@nuxeo.com', 'at@nuxeo.com',
    'nsilva@nuxeo.com',
    'ns@nuxeo.com', 'tcardoso@nuxeo.com', 'tc@nuxeo.com',
    'bchauvin@nuxeo.com',
    'bch@nuxeo.com', 'ajubert@nuxeo.com', 'anne.jubert@nuxeo.com',
    'aj@nuxeo.com',
    'sguitter@nuxeo.com', 'sg@nuxeo.com', 'mlumeau@nuxeo.com',
    'ml@nuxeo.com',
    'lkemen@nuxeo.com', 'lk@nuxeo.com', 'ktouchie@nuxeo.com',
    'kt@nuxeo.com',
    'aescaffre@nuxeo.com', 'ae@nuxeo.com', 'tdelprat@nuxeo.com',
    'td@nuxeo.com'
  ];

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
    }).then(function() {
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
    if(isSignedIn) {

      // Display link to Google Sheets if Admin
      var userEmail = gapi.auth2.getAuthInstance().currentUser.get().w3.U3;
      var userIsAdmin = ($.inArray(userEmail, adminEmails) > -1);
      var $gsheetsButton = $(
        '#content > #jumbo > .container-fluid > button#sheets-link');
      var gsheetsLink =
        'https://docs.google.com/spreadsheets/d/15lv3YL0WFkDB2DHYaIaOQN66HWrm21v7mP_-H9pkKEA/edit#gid=0';
      if(userIsAdmin) {
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

  // Get unique values of array
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  // Get unique values in column
  function getUniqueValues(roadmapElement) {
    var selector = '.' + roadmapElement;
    var values = [];
    $(selector).each(function() {
      if(roadmapElement == $('.epic')) {
        values.push($(this).text().replace(
          /https:\/\/jira.nuxeo.com\/browse\//, ''));
      } else {
        values.push($(this).text());
      }
    });
    return values.filter(onlyUnique);
  }

  // Add options to select2 menus
  function getOptions(roadmapElement) {
    var uniqueValues = getUniqueValues(roadmapElement);
    selector = '#select_' + roadmapElement;
    for(var i = 0; i < uniqueValues.length; i++) {
      var value = uniqueValues[i].toLowerCase().replace(/ /g, "_");
      $(selector).append('<option value="' + value + '">' + uniqueValues[i] +
        '</option');
    }
    $(selector).on('change', function(event) {
      filterBySelection();
    })
  }

  function filterBySelection() {
    $('.list-group-item').show();
    $('select:visible').each(function() {
      var selector = '#' + $(this).attr('id');
      var data = ($(selector).select2('data'));
      var roadmapElementClass = $(this).attr('id').replace(/select_/, '');
      if(data.length > 0) {
        var selections = '';
        for(var i = 0; i < data.length; i++) {
          if (i===0){
            selections = selections + data[i].text;
          } else {
            selections = selections + ',' + data[i].text;
          }
        }
        localStorage.setItem(roadmapElementClass, selections);
        $('.' + roadmapElementClass).each(function() {
          if($(this).parent().parent().is(':visible')) {
            $(this).parent().parent().hide();
            for(var i = 0; i < data.length; i++) {
              if($(this).text().indexOf(data[i].text) > -1) {
                $(this).parent().parent().show();
              }
            }
          }
        });
      } else {
        localStorage.removeItem(roadmapElementClass);
      }
    })
  }

  // Transform Epic links
  function styleEpicLinks() {
    var selector = 'td' + getSelectorFromHeading('epic');
    $(selector).each(function() {
      var link = $(this).html();
      var text = link.replace(/https:\/\/jira.nuxeo.com\/browse\//, '');
      if(text.length > 0) {
        $(this).html('<img src="css/img/epic.png" /><a href="' + link +
          '">&nbsp;' + text + '</a>');
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

      var range = response.result;

      if(range.values.length > 0) {

        // Create List Group
        $('#scrollbox').append(
          '<div id="roadmapItems" class="list-group"></div>');

        // Create Column Array
        var columns = [];
        var table = range.values;
        var thead = range.values[0];

        for(var i = 0; i < thead.length; i++) {
          columns.push(thead[i].toLowerCase().replace(/ /g, "_"));
        }

        var business_target = columns.indexOf('business_target');
        var roadmap_item = columns.indexOf('roadmap_item');
        var product = columns.indexOf('product');
        var team = columns.indexOf('team');
        var epic = columns.indexOf('epic');
        var status = columns.indexOf('status');
        var scope = columns.indexOf('scope');
        var origin = columns.indexOf('origin');
        var q_started = columns.indexOf('q_started');
        var q_delivered = columns.indexOf('q_delivered');
        var estimate_status = columns.indexOf('estimate_status');
        var product_version = columns.indexOf('product_version');

        for(var i = 1; i < table.length; i++) {

          // Create List Group Item
          if(typeof table[i][business_target] !== 'undefined') {
            var showBusinessTarget = table[i][business_target];

            $('#roadmapItems').append('<div id="row' + i +
              '" class="list-group-item ' +
              showBusinessTarget.toLowerCase().replace(/ /g, "_") +
              '"></div>');

            // Business Target
            $('#row' + i).append(
              '<div class="first col-md-2"><div class="business_target">' +
              showBusinessTarget.toUpperCase() + '</div><div class="version"><span class="badge">'
              + table[i][product_version] + '</span></div></div>');

          } else {
            $('#roadmapItems').append('<div id="row' + i +
              '" class="list-group-item"></div>');
            $('#row' + i).append(
              '<div class="col-md-2"><div class="business_target"></div><div class="version"><span class="badge">'
              + table[i][product_version] + '</span></div></div>');
          }

          // Main
          var showScope = '';
          var showOrigin = '';
          if(table[i][scope]) {
            showScope = '<p><span>SCOPE: </span>' + table[i][scope] +
              '</p>';
          }
          if(table[i][origin]) {
            showOrigin = '<p><span>ORIGIN: </span>' + table[i][origin] +
              '</p>';
          }
          $('#row' + i).append('<div class="main col-md-5"><h3>' +
            table[i][roadmap_item] +
            '</h3>' + showScope + showOrigin + '</div>');

          // Tags & links
          var link = table[i][epic];
          var linkButton = '';
          if(link !== 'undefined' && link) {
            var text = link.replace(
              /https:\/\/jira.nuxeo.com\/browse\//, '');
            linkButton = '<a href="' + link +
              '"><img src="css/img/epic.png" />&nbsp;' + text + '</a>'
          }
          $('#row' + i).append(
            '<div class="tags col-md-2"><div class="product"><span class="badge">' +
            table[i][product] +
            '</span></div><div class="team"><span class="badge">' +
            table[i][team] + ' Team</span></div><div class="epic">' +
            linkButton + '</div></div>');

          // Dates
          var showQStart = '<div class="q_started"></div>';
          var showQDeliver = '<div class="q_delivered"></div>';
          var showEstStatus = '<div class="estimate_status"></div>';

          if(table[i][q_started] && table[i][q_started] !== 'undefined' &&
            table[i][q_started].length > 0) {
            showQStart =
              '<div class="q_started"><span>START:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
              table[i][q_started] + '</div>';
          }
          if(table[i][q_delivered] && table[i][q_delivered] !==
            'undefined' && table[i][q_delivered].length > 0) {
            showQDeliver =
              '<div class="q_delivered"><span>DELIVER:</span>&nbsp;&nbsp;' +
              table[i][q_delivered] + '</div>';
          }
          if(table[i][estimate_status] && table[i][estimate_status] !==
            'undefined') {
            showEstStatus = '<div class="estimate_status">' +
              table[i][estimate_status] + '</div>';
          }
          $('#row' + i).append('<div class="dates col-md-2">' +
            showQStart + showQDeliver +
            showEstStatus + '</div');

          // Status & Epic
          var showStatus, progressBar = '';
          var percentageDone, progressClass;
          if(typeof table[i][status] !== 'undefined') {
            progressClass = table[i][status].toLowerCase().replace(/ /g,
              "_");
            showStatus = table[i][status].toUpperCase();
            switch(progressClass) {
              case 'todo':
                percentageDone = 0;
                break;
              case 'scope_defined':
                percentageDone = 5;
                break;
              case 'functional_specifications_in_progress':
                percentageDone = 10;
                break;
              case 'functional_specifications_done':
                percentageDone = 20;
                break;
              case 'technical_specifications_in_progress':
                percentageDone = 30;
                break;
              case 'technical_specifications_done':
                percentageDone = 45;
                break;
              case 'dev_in_progress':
                percentageDone = 65;
                break;
              case 'dev_done':
                percentageDone = 85;
                break;
              case 'released':
                percentageDone = 100;
                break;
              default:
                percentageDone = 0;
                break;
            }
          }
          if(percentageDone && percentageDone > 0) {
            progressBar =
              '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="' +
              percentageDone +
              '" aria-valuemin="0" aria-valuemax="100" style="width:' +
              percentageDone + '%"></div></div>';
          }
          $('#row' + i).append(
            '<div class="last col-md-2"><div class="status">' +
            showStatus + '</div>' + progressBar + '</div>');

        }

        $('#filters .filter').each(function() {

          var roadmapElement = $(this).attr('id');
          var select_id = '#select_' + $(this).attr('id');

          $(select_id).show();
          $(select_id).select2();

          getOptions(roadmapElement);
          // Get any stored filters

        });

        $('#filters .filter').each(function() {

          var roadmapElement = $(this).attr('id');
          var select_id = '#select_' + $(this).attr('id');

          var storedElement = 'localStorage.' + roadmapElement;
          if(typeof(Storage) !== "undefined") {
            var storedElement = localStorage.getItem(roadmapElement);
            if(storedElement) {
              var idArray = storedElement.toLowerCase().replace(/ /g, "_").split(",");
              $(select_id).val(idArray);
            }
          }
        });
        $('select').trigger('change');

      } else {
        $('#error').append('No data found.');
      }
    }, function(response) {
      $('#error').append('Error: ' + response.result.error.message);
    });
  }

  handleClientLoad();

});