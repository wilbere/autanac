autanac.define('web.test_utils_file', function () {
"use strict";

/**
 * FILE Test Utils
 *
 * This module defines various utility functions to help simulate events with
 * files, such as drag-and-drop.
 *
 * Note that all methods defined in this module are exported in the main
 * testUtils file.
 */


//------------------------------------------------------------------------------
// Private functions
//------------------------------------------------------------------------------

/**
 * Create a fake object 'dataTransfer', linked to some files, which is passed to
 * drag and drop events.
 *
 * @param {Object[]} files
 * @returns {Object}
 */
function _createFakeDataTransfer(files) {
    return {
        dropEffect: 'all',
        effectAllowed: 'all',
        files,
        getData: function () {
            return file;
        },
        items: [],
        types: ['Files'],
    };
}

//------------------------------------------------------------------------------
// Public functions
//------------------------------------------------------------------------------

/**
 * Create a file object, which can be used for drag-and-drop.
 *
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.content
 * @param {string} data.contentType
 * @returns {Promise<Object>} resolved with file created
 */
function createFile(data) {
    // Note: this is only supported by Chrome, and does not work in Incognito mode
    return new Promise(function (resolve, reject) {
        var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        if (!requestFileSystem) {
            throw new Error('FileSystem API is not supported');
        }
        requestFileSystem(window.TEMPORARY, 1024 * 1024, function (fileSystem) {
            fileSystem.root.getFile(data.name, { create: true }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function (e) {
                        fileSystem.root.getFile(data.name, {}, function (fileEntry) {
                            fileEntry.file(function (file) {
                                resolve(file);
                            });
                        });
                    };
                    fileWriter.write(new Blob([ data.content ], { type: data.contentType }));
                });
            });
        });
    });
}

/**
 * Drag a file over a DOM element
 *
 * @param {$.Element} $el
 * @param {Object} file must have been created beforehand (@see createFile)
 */
function dragoverFile($el, file) {
    var ev = new Event('dragover', { bubbles: true });
    Object.defineProperty(ev, 'dataTransfer', {
        value: _createFakeDataTransfer(file),
    });
    $el[0].dispatchEvent(ev);
}

/**
 * Drop a file on a DOM element.
 *
 * @param {$.Element} $el
 * @param {Object} file must have been created beforehand (@see createFile)
 */
function dropFile($el, file) {
    var ev = new Event('drop', { bubbles: true, });
    Object.defineProperty(ev, 'dataTransfer', {
        value: _createFakeDataTransfer([file]),
    });
    $el[0].dispatchEvent(ev);
}

/**
 * Drop some files on a DOM element.
 *
 * @param {$.Element} $el
 * @param {Object[]} files must have been created beforehand (@see createFile)
 */
function dropFiles($el, files) {
    var ev = new Event('drop', { bubbles: true, });
    Object.defineProperty(ev, 'dataTransfer', {
        value: _createFakeDataTransfer(files),
    });
    $el[0].dispatchEvent(ev);
}

//------------------------------------------------------------------------------
// Exposed API
//------------------------------------------------------------------------------

return {
    createFile: createFile,
    dragoverFile: dragoverFile,
    dropFile: dropFile,
    dropFiles,
};

});
