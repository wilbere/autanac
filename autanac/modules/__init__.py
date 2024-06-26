# -*- coding: utf-8 -*-

""" Modules (also called addons) management.

"""

from . import db, graph, loading, migration, module, registry

from autanac.modules.loading import load_modules, reset_modules_state

from autanac.modules.module import (
    adapt_version,
    get_module_path,
    get_module_resource,
    get_modules,
    get_modules_with_version,
    get_resource_from_path,
    get_resource_path,
    initialize_sys_path,
    load_information_from_description_file,
    load_openerp_module,
)
