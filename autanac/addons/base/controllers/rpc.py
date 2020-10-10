from datetime import date, datetime
from xmlrpc.client import dumps, loads
import xmlrpc.client

from werkzeug.wrappers import Response

from autanac.http import Controller, dispatch_rpc, request, route
from autanac.service import wsgi_server
from autanac.fields import Date, Datetime
from autanac.tools import lazy


class autanacMarshaller(xmlrpc.client.Marshaller):

   

    dispatch = dict(xmlrpc.client.Marshaller.dispatch)

    def dump_datetime(self, value, write):
        
        value = Datetime.to_string(value)
        self.dump_unicode(value, write)
    dispatch[datetime] = dump_datetime

    def dump_date(self, value, write):
        value = Date.to_string(value)
        self.dump_unicode(value, write)
    dispatch[date] = dump_date

    def dump_lazy(self, value, write):
        v = value._value
        return self.dispatch[type(v)](self, v, write)
    dispatch[lazy] = dump_lazy



xmlrpc.client.Marshaller = autanacMarshaller


class RPC(Controller):

    def _xmlrpc(self, service):
        data = request.httprequest.get_data()
        params, method = loads(data)
        result = dispatch_rpc(service, method, params)
        return dumps((result,), methodresponse=1, allow_none=False)

    @route("/xmlrpc/<service>", auth="none", methods=["POST"], csrf=False, save_session=False)
    def xmlrpc_1(self, service):
      
        try:
            response = self._xmlrpc(service)
        except Exception as error:
            response = wsgi_server.xmlrpc_handle_exception_string(error)
        return Response(response=response, mimetype='text/xml')

    @route("/xmlrpc/2/<service>", auth="none", methods=["POST"], csrf=False, save_session=False)
    def xmlrpc_2(self, service):
        try:
            response = self._xmlrpc(service)
        except Exception as error:
            response = wsgi_server.xmlrpc_handle_exception_int(error)
        return Response(response=response, mimetype='text/xml')

    @route('/jsonrpc', type='json', auth="none", save_session=False)
    def jsonrpc(self, service, method, args):
        return dispatch_rpc(service, method, args)
