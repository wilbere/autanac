include Makefile.version
include Makefile.python
include Makefile.servicename

SERVER_DIRECTORY=../..
FILES_DIRECTORY=release

MAKENSIS_ARGUMENTS=/DVERSION=$(VERSION) /DSERVICENAME=${SERVICENAME} /DPYTHONVERSION=${PYTHON_VERSION}

LAUNCH_MAKENSIS=/cygdrive/c/tools/cygwin/makensis $(MAKENSIS_ARGUMENTS) setup.nsi
WINPY_DIR=/cygdrive/c/autanacbuild/WinPython/python-${PYTHON_VERSION}

default: allinone

clean: server_clean
	rm -rf $(FILES_DIRECTORY)/*.exe
	rm -rf *.exe

server_clean:
	rm -rf $(SERVER_DIRECTORY)/dist 
	rm -rf $(SERVER_DIRECTORY)/build
	rm -rf $(SERVER_DIRECTORY)/win32/dist 
	rm -rf $(SERVER_DIRECTORY)/win32/build
	rm -rf $(SERVER_DIRECTORY)/*.exe
	rm -rf $(SERVER_DIRECTORY)/.cyg*

allinone: server_clean
	cp $(SERVER_DIRECTORY)/requirements.txt $(WINPY_DIR)/
	-(cd $(WINPY_DIR) && ./python.exe -m pip install --upgrade pip)
	-(cd $(WINPY_DIR) && cat requirements.txt | while read PAC ; do Scripts/pip3.exe install "$${PAC}" ; done)
	-(cd $(WINPY_DIR) && Scripts/pip3.exe freeze)
	rm $(WINPY_DIR)/requirements.txt
	(cd $(SERVER_DIRECTORY)/setup/win32 && $(LAUNCH_MAKENSIS))
	(cd $(SERVER_DIRECTORY)/setup/win32 && mkdir -p $(FILES_DIRECTORY))
	(cd $(SERVER_DIRECTORY)/setup/win32 && cp openerp-*.exe $(FILES_DIRECTORY)/openerp-server-setup-$(VERSION).exe)
